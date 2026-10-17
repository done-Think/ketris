import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET } from '../../finance/route'
import { GET as getOverview } from '../../overview/route'

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

  it('cobra pelo plano do tipo de conta e soma no MRR só as contas ativas', async () => {
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
    const finance = await response.json()
    type Account = { id: string; slug: string; status: string; monthlyCharge: { total: number } }
    const accounts: Account[] = finance.accounts
    // Other test files create tenants concurrently, so only compare numbers from this response.
    const activeTotal =
      accounts
        .filter((account) => account.status === 'ACTIVE')
        .reduce((cents, account) => cents + Math.round(account.monthlyCharge.total * 100), 0) / 100

    expect(response.status).toBe(200)
    expect(finance.mrr).toBe(activeTotal)
    expect(finance.payingAccounts).toBe(
      accounts.filter((account) => account.status === 'ACTIVE').length,
    )
    expect(accounts.find((account) => account.id === tenantIds[0])).toMatchObject({
      status: 'ACTIVE',
      monthlyCharge: { total: plan.monthlyPrice.toNumber() },
    })
    expect(accounts.find((account) => account.id === tenantIds[1])).toMatchObject({
      status: 'TRIAL',
      monthlyCharge: { total: plan.monthlyPrice.toNumber() },
    })
    expect(accounts.some((account) => account.slug === 'locatarios')).toBe(false)
  })

  it('a visão geral traz o MRR e o churn calculados pelos planos', async () => {
    const response = await getOverview(
      new NextRequest('http://localhost/api/platform/overview', {
        headers: { authorization: `Bearer ${actorToken}` },
      }),
    )
    const overview = await response.json()

    expect(response.status).toBe(200)
    expect(overview.metrics.mrr).toEqual(expect.any(Number))
    expect(overview.metrics).toHaveProperty('churnRate')
  })
})
