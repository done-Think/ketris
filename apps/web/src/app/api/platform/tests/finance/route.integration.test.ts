import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET } from '../../finance/route'

describe('GET /api/platform/finance (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  const tenantIds: string[] = []

  beforeAll(async () => {
    const actor = await prisma.platformAdmin.create({
      data: {
        nome: 'Ator Financeiro',
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
  })

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    await prisma.platformAdmin.delete({ where: { id: actorId } })
    await prisma.$disconnect()
  })

  async function getFinance(token: string | null = actorToken) {
    return GET(
      new NextRequest('http://localhost/api/platform/finance', {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      }),
    )
  }

  it('retorna 401 sem token de platform admin', async () => {
    expect((await getFinance(null)).status).toBe(401)
  })

  it('soma no MRR a mensalidade das contas ativas e ignora as que estão em teste', async () => {
    const before = await (await getFinance()).json()
    const plan = await prisma.platformPlan.findUniqueOrThrow({
      where: { accountType: 'INDIVIDUAL' },
    })

    for (const status of ['ACTIVE', 'TRIAL'] as const) {
      const tenant = await prisma.tenant.create({
        data: {
          nome: `Pessoa ${status}`,
          slug: `pessoa-financeiro-${randomUUID()}`,
          accountType: 'INDIVIDUAL',
          status,
        },
      })
      tenantIds.push(tenant.id)
    }

    const response = await getFinance()
    const after = await response.json()

    expect(response.status).toBe(200)
    expect(after.mrr - before.mrr).toBeCloseTo(plan.monthlyPrice.toNumber(), 2)
    expect(after.payingAccounts - before.payingAccounts).toBe(1)
    expect(after.trialAccounts - before.trialAccounts).toBe(1)
    expect(
      after.accounts.find((account: { id: string }) => account.id === tenantIds[0]),
    ).toMatchObject({
      accountType: 'INDIVIDUAL',
      status: 'ACTIVE',
      monthlyCharge: { total: plan.monthlyPrice.toNumber() },
    })
    expect(after.accounts.some((account: { slug: string }) => account.slug === 'locatarios')).toBe(
      false,
    )
  })
})
