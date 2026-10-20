import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'
import { PrismaPlatformTenantRepository } from '@server/platform/infrastructure/prisma-platform-tenant.repository'

import { GET as listTenants } from '../../../../tenants/route'
import { PATCH } from '../../../../tenants/[id]/account/route'

describe('PATCH /api/platform/tenants/[id]/account (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  let tenantId: string

  beforeAll(async () => {
    const actor = await prisma.platformAdmin.create({
      data: {
        nome: 'Ator Conta',
        email: `ator-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      nome: actor.nome,
      email: actor.email,
      role: 'ADMIN',
      ativo: true,
    })

    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Conta', slug: `tenant-conta-${randomUUID()}` },
    })
    tenantId = tenant.id
  })

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantId, ...extraTenantIds] } } })
    await prisma.platformAdmin.delete({ where: { id: actorId } })
    await prisma.$disconnect()
  })

  const extraTenantIds: string[] = []

  async function createTenant() {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Histórico', slug: `tenant-historico-${randomUUID()}` },
    })
    extraTenantIds.push(tenant.id)

    return tenant
  }

  function history(id: string) {
    return prisma.tenantStatusChange.findMany({
      where: { tenantId: id },
      orderBy: { changedAt: 'asc' },
      select: { fromStatus: true, toStatus: true, changedById: true },
    })
  }

  function patch(body: unknown, options: { id?: string; token?: string | null } = {}) {
    const id = options.id ?? tenantId
    const token = options.token === undefined ? actorToken : options.token

    return PATCH(
      new NextRequest(`http://localhost/api/platform/tenants/${id}/account`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
      }),
      { params: Promise.resolve({ id }) },
    )
  }

  it('cria tenants como imobiliária ativa por padrão', async () => {
    const response = await listTenants(
      new NextRequest('http://localhost/api/platform/tenants', {
        headers: { authorization: `Bearer ${actorToken}` },
      }),
    )
    const json = await response.json()

    expect(json.tenants.find((tenant: { id: string }) => tenant.id === tenantId)).toMatchObject({
      accountType: 'AGENCY',
      status: 'ACTIVE',
      canceledAt: null,
    })
  })

  it('retorna 401 sem token de platform admin', async () => {
    const response = await patch({ accountType: 'BROKER', status: 'ACTIVE' }, { token: null })

    expect(response.status).toBe(401)
  })

  it('retorna 404 para um tenant inexistente', async () => {
    const response = await patch(
      { accountType: 'BROKER', status: 'ACTIVE' },
      { id: 'tenant-inexistente' },
    )

    expect(response.status).toBe(404)
  })

  it.each([
    [{ accountType: 'GOLD', status: 'ACTIVE' }],
    [{ accountType: 'BROKER', status: 'PAUSED' }],
    [{ accountType: 'BROKER' }],
    [{ status: 'ACTIVE' }],
  ])('retorna 400 para dados inválidos: %j', async (body) => {
    const response = await patch(body)

    expect(response.status).toBe(400)
  })

  it('salva o tipo de conta e a situação e registra a troca com quem fez', async () => {
    const response = await patch({ accountType: 'INDIVIDUAL', status: 'TRIAL' })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.tenant).toMatchObject({
      id: tenantId,
      accountType: 'INDIVIDUAL',
      status: 'TRIAL',
      canceledAt: null,
    })
    expect(await history(tenantId)).toEqual([
      { fromStatus: 'ACTIVE', toStatus: 'TRIAL', changedById: actorId },
    ])
  })

  it('mudar só o tipo de conta não grava troca de situação', async () => {
    const before = await history(tenantId)
    const response = await patch({ accountType: 'AGENCY', status: 'TRIAL' })

    expect(response.status).toBe(200)
    expect(await history(tenantId)).toEqual(before)
  })

  it('cancelar, reativar e cancelar de novo guarda as três trocas', async () => {
    const tenant = await createTenant()
    const canceled = await (
      await patch({ accountType: 'BROKER', status: 'CANCELED' }, { id: tenant.id })
    ).json()

    expect(canceled.tenant.status).toBe('CANCELED')
    expect(new Date(canceled.tenant.canceledAt).getTime()).toBeGreaterThan(Date.now() - 60_000)

    const reactivated = await (
      await patch({ accountType: 'BROKER', status: 'ACTIVE' }, { id: tenant.id })
    ).json()
    expect(reactivated.tenant.canceledAt).toBeNull()

    const canceledAgain = await (
      await patch({ accountType: 'BROKER', status: 'CANCELED' }, { id: tenant.id })
    ).json()
    expect(new Date(canceledAgain.tenant.canceledAt).getTime()).toBeGreaterThan(
      new Date(canceled.tenant.canceledAt).getTime(),
    )

    // Reactivating cleared the displayed date but not the first cancellation.
    expect(await history(tenant.id)).toEqual([
      { fromStatus: 'ACTIVE', toStatus: 'CANCELED', changedById: actorId },
      { fromStatus: 'CANCELED', toStatus: 'ACTIVE', changedById: actorId },
      { fromStatus: 'ACTIVE', toStatus: 'CANCELED', changedById: actorId },
    ])
  })

  it('alterações simultâneas da situação não deixam o histórico inconsistente', async () => {
    const tenant = await createTenant()
    const statuses = ['CANCELED', 'SUSPENDED', 'TRIAL', 'CANCELED', 'SUSPENDED', 'TRIAL']

    const responses = await Promise.all(
      statuses.map((status) => patch({ accountType: 'AGENCY', status }, { id: tenant.id })),
    )
    const bodies = await Promise.all(responses.map((response) => response.json()))

    for (const [index, response] of responses.entries()) {
      expect([200, 409]).toContain(response.status)
      if (response.status === 409) {
        expect(bodies[index].error.code).toBe('TENANT_ACCOUNT_CHANGED_CONCURRENTLY')
      }
    }

    const changes = await history(tenant.id)
    const current = await prisma.tenant.findUniqueOrThrow({ where: { id: tenant.id } })

    expect(changes.length).toBeGreaterThan(0)
    expect(changes[0].fromStatus).toBe('ACTIVE')
    for (let index = 1; index < changes.length; index += 1) {
      expect(changes[index].fromStatus).toBe(changes[index - 1].toStatus)
    }
    expect(changes[changes.length - 1].toStatus).toBe(current.status)
  })

  it('não grava nada quando a situação lida já mudou (conflito)', async () => {
    const tenant = await createTenant()
    const repository = new PrismaPlatformTenantRepository()

    const result = await repository.updateAccount(
      tenant.id,
      'TRIAL',
      { accountType: 'BROKER', status: 'CANCELED', canceledAt: new Date() },
      { fromStatus: 'TRIAL', toStatus: 'CANCELED', changedAt: new Date(), changedById: actorId },
    )

    expect(result).toBeNull()
    expect(await prisma.tenant.findUniqueOrThrow({ where: { id: tenant.id } })).toMatchObject({
      accountType: 'AGENCY',
      status: 'ACTIVE',
      canceledAt: null,
    })
    expect(await history(tenant.id)).toEqual([])
  })

  it('mantém o histórico quando o platform admin é removido e apaga junto com o tenant', async () => {
    const tenant = await createTenant()
    const otherAdmin = await prisma.platformAdmin.create({
      data: { nome: 'Ator Removido', email: `ator-${randomUUID()}@ketris.dev`, senhaHash: 'x' },
    })
    const otherToken = await tokenService.sign({
      id: otherAdmin.id,
      nome: otherAdmin.nome,
      email: otherAdmin.email,
      role: 'ADMIN',
      ativo: true,
    })

    await patch(
      { accountType: 'AGENCY', status: 'SUSPENDED' },
      { id: tenant.id, token: otherToken },
    )
    await prisma.platformAdmin.delete({ where: { id: otherAdmin.id } })

    expect(await history(tenant.id)).toEqual([
      { fromStatus: 'ACTIVE', toStatus: 'SUSPENDED', changedById: null },
    ])

    await prisma.tenant.delete({ where: { id: tenant.id } })
    expect(await prisma.tenantStatusChange.count({ where: { tenantId: tenant.id } })).toBe(0)
  })
})

describe('GET /api/platform/tenants – mensalidade (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  let tenantId: string

  beforeAll(async () => {
    const actor = await prisma.platformAdmin.create({
      data: {
        nome: 'Ator Mensalidade',
        email: `ator-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      nome: actor.nome,
      email: actor.email,
      role: 'ADMIN',
      ativo: true,
    })
    const tenant = await prisma.tenant.create({
      data: {
        nome: 'Corretor Mensalidade',
        slug: `corretor-mensalidade-${randomUUID()}`,
        accountType: 'BROKER',
      },
    })
    tenantId = tenant.id
    const owner = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Responsável',
        email: `responsavel-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })
    // 12 properties count toward the plan; the inactive one does not.
    const statuses = [...Array<'PUBLISHED'>(12).fill('PUBLISHED'), 'INACTIVE' as const]
    for (const [index, status] of statuses.entries()) {
      await prisma.imovel.create({
        data: {
          tenantId,
          responsavelId: owner.id,
          titulo: `Imóvel ${index}`,
          finalidade: 'VENDA',
          tipo: 'casa',
          valor: 1000,
          status,
        },
      })
    }
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => undefined)
    await prisma.platformAdmin.delete({ where: { id: actorId } })
  })

  it('calcula a mensalidade pelo plano do tipo de conta e pelos imóveis acima do limite', async () => {
    const plan = await prisma.platformPlan.findUniqueOrThrow({ where: { accountType: 'BROKER' } })
    const response = await listTenants(
      new NextRequest('http://localhost/api/platform/tenants', {
        headers: { authorization: `Bearer ${actorToken}` },
      }),
    )
    const json = await response.json()
    const extraUnits = Math.max(0, 12 - plan.includedUnits)

    expect(
      json.tenants.find((tenant: { id: string }) => tenant.id === tenantId).monthlyCharge,
    ).toEqual({
      usageUnit: 'PROPERTIES',
      usage: 12,
      includedUnits: plan.includedUnits,
      extraUnits,
      basePrice: plan.monthlyPrice.toNumber(),
      extraAmount: Math.round(extraUnits * plan.extraUnitPrice.toNumber() * 100) / 100,
      total:
        Math.round(
          (plan.monthlyPrice.toNumber() + extraUnits * plan.extraUnitPrice.toNumber()) * 100,
        ) / 100,
    })
  })

  it('não calcula mensalidade para o tenant de sistema dos locatários', async () => {
    const response = await listTenants(
      new NextRequest('http://localhost/api/platform/tenants', {
        headers: { authorization: `Bearer ${actorToken}` },
      }),
    )
    const json = await response.json()
    const renters = json.tenants.find((tenant: { slug: string }) => tenant.slug === 'locatarios')

    if (renters) expect(renters.monthlyCharge).toBeNull()
  })
})
