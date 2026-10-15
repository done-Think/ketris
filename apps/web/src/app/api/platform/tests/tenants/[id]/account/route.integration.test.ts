import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

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
    await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => undefined)
    await prisma.platformAdmin.delete({ where: { id: actorId } })
    await prisma.$disconnect()
  })

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

  it('salva o tipo de conta e a situação', async () => {
    const response = await patch({ accountType: 'INDIVIDUAL', status: 'TRIAL' })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.tenant).toMatchObject({
      id: tenantId,
      accountType: 'INDIVIDUAL',
      status: 'TRIAL',
      canceledAt: null,
    })
  })

  it('registra a data ao cancelar e limpa ao reativar', async () => {
    const canceled = await (await patch({ accountType: 'BROKER', status: 'CANCELED' })).json()

    expect(canceled.tenant.status).toBe('CANCELED')
    expect(new Date(canceled.tenant.canceledAt).getTime()).toBeGreaterThan(Date.now() - 60_000)

    const reactivated = await (await patch({ accountType: 'BROKER', status: 'ACTIVE' })).json()
    expect(reactivated.tenant.canceledAt).toBeNull()
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
