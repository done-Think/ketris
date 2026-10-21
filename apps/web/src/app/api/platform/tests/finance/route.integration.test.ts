import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { monthBoundsInTimeZone } from '@server/platform/domain/platform-calendar'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET } from '../../finance/route'
import { GET as getOverview } from '../../overview/route'
import { PATCH as patchAccount } from '../../tenants/[id]/account/route'

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
    // The plans test edits the INDIVIDUAL plan while the files run in parallel, so use BROKER.
    const plan = await prisma.platformPlan.findUniqueOrThrow({
      where: { accountType: 'BROKER' },
    })
    for (const status of ['ACTIVE', 'TRIAL'] as const) {
      const tenant = await prisma.tenant.create({
        data: {
          nome: `Corretor ${status}`,
          slug: `corretor-financeiro-${randomUUID()}`,
          accountType: 'BROKER',
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

  it('mede o churn pelo histórico: reativar não muda a base nem apaga o cancelamento', async () => {
    const month = monthBoundsInTimeZone(new Date())
    const beforeMonth = new Date(month.start.getTime() - 30 * 24 * 60 * 60 * 1000)
    const create = async (data: { status: 'ACTIVE' | 'CANCELED'; canceledAt?: Date }) => {
      const tenant = await prisma.tenant.create({
        data: {
          nome: 'Imobiliária Churn',
          slug: `imobiliaria-churn-${randomUUID()}`,
          createdAt: beforeMonth,
          ...data,
        },
      })
      tenantIds.push(tenant.id)

      return tenant
    }
    const changeStatus = (id: string, status: string) =>
      patchAccount(
        new NextRequest(`http://localhost/api/platform/tenants/${id}/account`, {
          method: 'PATCH',
          body: JSON.stringify({ accountType: 'AGENCY', status }),
          headers: { 'Content-Type': 'application/json', authorization: `Bearer ${actorToken}` },
        }),
        { params: Promise.resolve({ id }) },
      )
    const churnNumbers = async () => {
      const finance = await (await getFinance()).json()
      const overview = await (
        await getOverview(
          new NextRequest('http://localhost/api/platform/overview', {
            headers: { authorization: `Bearer ${actorToken}` },
          }),
        )
      ).json()

      // Both screens must show the same churn.
      expect(overview.metrics.churnRate).toBe(finance.churnRate)
      expect(finance.churnRate).toBe(
        finance.churnBaseAccounts ? finance.canceledThisMonth / finance.churnBaseAccounts : null,
      )

      return {
        canceledThisMonth: finance.canceledThisMonth as number,
        churnBaseAccounts: finance.churnBaseAccounts as number,
      }
    }

    // Tenants created by other test files are new this month, so they never enter the base.
    const baseline = await churnNumbers()
    const stays = await create({ status: 'ACTIVE' })
    const leaves = await create({ status: 'ACTIVE' })
    // Canceled last month and reactivated now: not part of this month's base.
    const lastMonth = await create({ status: 'CANCELED', canceledAt: beforeMonth })
    await prisma.tenantStatusChange.create({
      data: {
        tenantId: lastMonth.id,
        fromStatus: 'ACTIVE',
        toStatus: 'CANCELED',
        changedAt: beforeMonth,
      },
    })
    const delta = async () => {
      const current = await churnNumbers()

      return {
        canceledThisMonth: current.canceledThisMonth - baseline.canceledThisMonth,
        churnBaseAccounts: current.churnBaseAccounts - baseline.churnBaseAccounts,
      }
    }

    expect(stays.id).toBeTruthy()
    expect(await delta()).toEqual({ canceledThisMonth: 0, churnBaseAccounts: 2 })

    expect((await changeStatus(leaves.id, 'CANCELED')).status).toBe(200)
    expect(await delta()).toEqual({ canceledThisMonth: 1, churnBaseAccounts: 2 })

    expect((await changeStatus(leaves.id, 'ACTIVE')).status).toBe(200)
    expect((await changeStatus(lastMonth.id, 'ACTIVE')).status).toBe(200)
    expect(await delta()).toEqual({ canceledThisMonth: 1, churnBaseAccounts: 2 })

    expect((await changeStatus(leaves.id, 'CANCELED')).status).toBe(200)
    expect((await changeStatus(lastMonth.id, 'CANCELED')).status).toBe(200)
    expect(await delta()).toEqual({ canceledThisMonth: 1, churnBaseAccounts: 2 })
  })
})
