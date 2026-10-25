import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { PrismaRegistrationRepository } from '../../infrastructure/prisma-registration.repository'
import { AgencyNotFoundError, RegistrationEmailAlreadyInUseError } from '../../domain/errors'
import type { NewTenantWithAdmin } from '../../types/account'

const repository = new PrismaRegistrationRepository()
const prefix = `registration-${randomUUID()}`
const acceptedAt = new Date('2026-10-24T12:00:00.000Z')

function ownerInput(suffix: string): NewTenantWithAdmin {
  return {
    tenantName: `${prefix}-${suffix}`,
    adminName: 'Pessoa Teste',
    email: `${randomUUID()}@example.test`,
    senhaHash: 'first-test-hash',
    accountType: 'AGENCY',
    status: 'TRIAL',
    telefone: '+5511999999999',
    creci: 'CRECI-123',
    termosAceitosEm: acceptedAt,
    createBrokerProfile: false,
  }
}

async function agency(
  suffix: string,
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELED' = 'ACTIVE',
) {
  const result = await repository.createTenantWithAdmin({ ...ownerInput(suffix), status })
  return result.tenant
}

function memberInput(tenantId: string, email = `${randomUUID()}@example.test`) {
  return {
    tenantId,
    nome: 'Corretor Teste',
    email,
    senhaHash: 'member-test-hash',
    papel: 'AGENT' as const,
    pendingApproval: true,
    telefone: '+5511888888888',
    creci: 'CRECI-456',
    termosAceitosEm: acceptedAt,
    createBrokerProfile: true,
  }
}

afterAll(async () => {
  await prisma.tenant.deleteMany({ where: { slug: { startsWith: prefix } } })
  await prisma.$disconnect()
})

describe('PrismaRegistrationRepository', () => {
  it('persists an independent broker owner and matching draft public profile before email verification', async () => {
    const input = {
      ...ownerInput('independent-broker'),
      accountType: 'BROKER' as const,
      createBrokerProfile: true,
    }
    const { tenant, user } = await repository.createTenantWithAdmin(input)
    const stored = await prisma.usuario.findUniqueOrThrow({
      where: { id: user.id },
      include: { perfilPublico: true },
    })
    expect(tenant).toMatchObject({ accountType: 'BROKER', status: 'TRIAL' })
    expect(stored).toMatchObject({
      papel: 'OWNER',
      telefone: input.telefone,
      creci: input.creci,
      termosAceitosEm: acceptedAt,
      emailVerificadoEm: null,
      versaoSessao: 0,
      perfilPublico: {
        displayName: input.adminName,
        telefone: input.telefone,
        creci: input.creci,
        status: 'DRAFT',
        publicadoEm: null,
      },
    })
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0)
  })

  it('keeps passwords and account lookups scoped to each tenant for the same email', async () => {
    const email = `${randomUUID()}@example.test`
    const first = await repository.createTenantWithAdmin({
      ...ownerInput('first-same-email'),
      email,
    })
    const second = await repository.createTenantWithAdmin({
      ...ownerInput('second-same-email'),
      email: `  ${email.toUpperCase()}  `,
      senhaHash: 'second-test-hash',
    })
    expect(first.user.id).not.toBe(second.user.id)
    expect(await repository.findAccountByEmail(first.tenant.id, email)).toEqual(first.user)
    expect(await repository.findAccountByEmail(second.tenant.id, email)).toEqual(second.user)
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: first.user.id } })).senhaHash,
    ).toBe('first-test-hash')
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: second.user.id } })).senhaHash,
    ).toBe('second-test-hash')
  })

  it('retries concurrent slug collisions transactionally without orphan tenants or owners', async () => {
    const input = ownerInput('same-concurrent-name')
    const results = await Promise.all(
      Array.from({ length: 4 }, () => repository.createTenantWithAdmin(input)),
    )
    expect(new Set(results.map((result) => result.tenant.slug)).size).toBe(4)
    for (const result of results) {
      expect(await prisma.usuario.count({ where: { tenantId: result.tenant.id } })).toBe(1)
    }
  })

  it.each(['ACTIVE', 'TRIAL'] as const)(
    'creates a pending agent and draft profile in an %s agency',
    async (status) => {
      const tenant = await agency(`member-${status}`, status)
      const input = memberInput(tenant.id)
      const user = await repository.createMember(input)
      expect(
        await prisma.usuario.findUniqueOrThrow({
          where: { id: user.id },
          include: { perfilPublico: true },
        }),
      ).toMatchObject({
        papel: 'AGENT',
        emailVerificadoEm: null,
        vinculoAprovadoEm: null,
        telefone: input.telefone,
        creci: input.creci,
        termosAceitosEm: acceptedAt,
        perfilPublico: {
          displayName: input.nome,
          telefone: input.telefone,
          creci: input.creci,
          status: 'DRAFT',
        },
      })
    },
  )

  it('handles duplicate concurrent membership attempts within one tenant while allowing another tenant', async () => {
    const first = await agency('duplicate-first')
    const second = await agency('duplicate-second')
    const input = memberInput(first.id)
    const attempts = await Promise.allSettled([
      repository.createMember(input),
      repository.createMember(input),
    ])
    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1)
    const failure = attempts.find(
      (attempt) => attempt.status === 'rejected',
    ) as PromiseRejectedResult
    expect(failure.reason).toBeInstanceOf(RegistrationEmailAlreadyInUseError)
    expect(await prisma.usuario.count({ where: { tenantId: first.id, email: input.email } })).toBe(
      1,
    )
    expect(await repository.findAccountByEmail(second.id, input.email)).toBeNull()
    expect(await repository.createMember({ ...input, tenantId: second.id })).toMatchObject({
      tenantId: second.id,
      email: input.email,
    })
  })

  it.each([
    { accountType: 'BROKER' as const, status: 'ACTIVE' as const },
    { accountType: 'INDIVIDUAL' as const, status: 'ACTIVE' as const },
    { accountType: 'AGENCY' as const, status: 'SUSPENDED' as const },
    { accountType: 'AGENCY' as const, status: 'CANCELED' as const },
  ])('rejects ineligible agencies inside the registration transaction (%j)', async (state) => {
    const { tenant } = await repository.createTenantWithAdmin({
      ...ownerInput(`blocked-${state.accountType}-${state.status}`),
      ...state,
    })
    const input = memberInput(tenant.id)
    await expect(repository.createMember(input)).rejects.toThrow(AgencyNotFoundError)
    expect(await repository.findAccountByEmail(tenant.id, input.email)).toBeNull()
  })

  it('preserves existing memberships when an agency becomes unavailable for new memberships', async () => {
    const tenant = await agency('old-membership')
    const user = await repository.createMember(memberInput(tenant.id))
    await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'SUSPENDED' } })
    await expect(repository.createMember(memberInput(tenant.id))).rejects.toThrow(
      AgencyNotFoundError,
    )
    expect(await repository.findAccountByEmail(tenant.id, user.email)).toEqual(user)
  })

  it('persists renter metadata without creating a broker profile or verifying email', async () => {
    const tenant = await agency('renter-system')
    const user = await repository.createMember({
      ...memberInput(tenant.id),
      papel: 'RENTER',
      pendingApproval: false,
      creci: undefined,
      createBrokerProfile: false,
    })
    const stored = await prisma.usuario.findUniqueOrThrow({
      where: { id: user.id },
      include: { perfilPublico: true },
    })
    expect(stored).toMatchObject({
      papel: 'RENTER',
      emailVerificadoEm: null,
      telefone: '+5511888888888',
      termosAceitosEm: acceptedAt,
      perfilPublico: null,
    })
    expect(stored.vinculoAprovadoEm).toBeInstanceOf(Date)
  })

  it('searches only eligible agencies, excludes requested slugs, and limits ordered results to twenty', async () => {
    const query = `${prefix}-search`
    const data = Array.from({ length: 24 }, (_, index) => ({
      nome: `${query}-${String(index).padStart(2, '0')}`,
      slug: `${query}-${index}`,
      accountType: 'AGENCY' as const,
      status: index % 2 ? ('ACTIVE' as const) : ('TRIAL' as const),
    }))
    await prisma.tenant.createMany({
      data: [
        ...data,
        {
          nome: `${query}-blocked`,
          slug: `${query}-blocked`,
          accountType: 'AGENCY',
          status: 'SUSPENDED',
        },
        {
          nome: `${query}-broker`,
          slug: `${query}-broker`,
          accountType: 'BROKER',
          status: 'ACTIVE',
        },
        {
          nome: `${query}-individual`,
          slug: `${query}-individual`,
          accountType: 'INDIVIDUAL',
          status: 'ACTIVE',
        },
      ],
    })
    const results = await repository.searchByName(query.toUpperCase(), [data[0].slug])
    expect(results).toHaveLength(20)
    expect(results.map((result) => result.nome)).toEqual(
      data.slice(1, 21).map((record) => record.nome),
    )
    expect(
      results.every(
        (result) => result.accountType === 'AGENCY' && ['ACTIVE', 'TRIAL'].includes(result.status),
      ),
    ).toBe(true)
    expect(await repository.findTenantById(results[0].id)).toEqual(results[0])
    expect(await repository.findTenantBySlug(results[0].slug)).toEqual(results[0])
  })
})
