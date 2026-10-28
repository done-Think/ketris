import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import type { PlatformPlan } from '@prisma/client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET } from '../../plans/route'
import { PATCH } from '../../plans/[accountType]/route'

describe('/api/platform/plans (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  let originalIndividualPlan: Pick<
    PlatformPlan,
    'monthlyPrice' | 'includedUnits' | 'extraUnitPrice' | 'updatedById' | 'updatedByName'
  >

  beforeAll(async () => {
    const actor = await prisma.platformAdmin.create({
      data: {
        name: 'Ator Planos',
        email: `ator-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      name: actor.name,
      email: actor.email,
      role: 'ADMIN',
      active: true,
    })
    originalIndividualPlan = await prisma.platformPlan.findUniqueOrThrow({
      where: { accountType: 'INDIVIDUAL' },
      select: {
        monthlyPrice: true,
        includedUnits: true,
        extraUnitPrice: true,
        updatedById: true,
        updatedByName: true,
      },
    })
  })

  afterAll(async () => {
    await prisma.platformPlanChange.deleteMany({ where: { changedById: actorId } })
    await prisma.platformPlan.update({
      where: { accountType: 'INDIVIDUAL' },
      data: originalIndividualPlan,
    })
    await prisma.platformAdmin.delete({ where: { id: actorId } })
    await prisma.$disconnect()
  })

  function request(method: string, url: string, body?: unknown, token: string | null = actorToken) {
    return new NextRequest(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  function patch(accountType: string, body: unknown, token?: string | null) {
    return PATCH(
      request('PATCH', `http://localhost/api/platform/plans/${accountType}`, body, token),
      {
        params: Promise.resolve({ accountType }),
      },
    )
  }

  it('lista os três planos com a unidade de limite de cada um', async () => {
    const response = await GET(request('GET', 'http://localhost/api/platform/plans'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(
      json.plans.map((plan: { accountType: string; usageUnit: string }) => [
        plan.accountType,
        plan.usageUnit,
      ]),
    ).toEqual([
      ['INDIVIDUAL', 'PROPERTIES'],
      ['BROKER', 'PROPERTIES'],
      ['AGENCY', 'BROKERS'],
    ])
    expect(json.plans[0]).toEqual(
      expect.objectContaining({
        monthlyPrice: expect.any(Number),
        includedUnits: expect.any(Number),
        extraUnitPrice: expect.any(Number),
        activeAccounts: expect.any(Number),
      }),
    )
  })

  it('retorna 401 sem token de platform admin', async () => {
    expect(
      (await GET(request('GET', 'http://localhost/api/platform/plans', undefined, null))).status,
    ).toBe(401)
    expect(
      (await patch('INDIVIDUAL', { monthlyPrice: 1, includedUnits: 1, extraUnitPrice: 1 }, null))
        .status,
    ).toBe(401)
  })

  it('retorna 403 para platform admin sem a função ADMIN e não altera o preço', async () => {
    const admin = await prisma.platformAdmin.create({
      data: {
        name: 'Agente Planos',
        email: `agente-${randomUUID()}@ketris.dev`,
        passwordHash: 'x',
        role: 'AGENT',
      },
    })
    const token = await tokenService.sign({ ...admin })
    const before = await prisma.platformPlan.findUniqueOrThrow({
      where: { accountType: 'INDIVIDUAL' },
    })

    try {
      const response = await patch(
        'INDIVIDUAL',
        { monthlyPrice: 1, includedUnits: 1, extraUnitPrice: 1 },
        token,
      )

      expect(response.status).toBe(403)
      expect(
        await prisma.platformPlan.findUniqueOrThrow({ where: { accountType: 'INDIVIDUAL' } }),
      ).toEqual(before)
      // Reading the plans stays open to every platform admin.
      expect(
        (await GET(request('GET', 'http://localhost/api/platform/plans', undefined, token))).status,
      ).toBe(200)
    } finally {
      await prisma.platformAdmin.delete({ where: { id: admin.id } })
    }
  })

  it('retorna 404 para um tipo de conta inexistente', async () => {
    const response = await patch('GOLD', { monthlyPrice: 1, includedUnits: 1, extraUnitPrice: 1 })

    expect(response.status).toBe(404)
  })

  it.each([
    [{ monthlyPrice: -1, includedUnits: 10, extraUnitPrice: 1 }],
    [{ monthlyPrice: 10.001, includedUnits: 10, extraUnitPrice: 1 }],
    [{ monthlyPrice: 10, includedUnits: 1.5, extraUnitPrice: 1 }],
    [{ monthlyPrice: 10, includedUnits: -1, extraUnitPrice: 1 }],
    [{ monthlyPrice: 10, includedUnits: 10 }],
  ])('retorna 400 para valores inválidos: %j', async (body) => {
    expect((await patch('INDIVIDUAL', body)).status).toBe(400)
  })

  it('salva preço, limite e valor do extra', async () => {
    const response = await patch('INDIVIDUAL', {
      monthlyPrice: 59.9,
      includedUnits: 15,
      extraUnitPrice: 4.5,
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.plan).toMatchObject({
      accountType: 'INDIVIDUAL',
      usageUnit: 'PROPERTIES',
      monthlyPrice: 59.9,
      includedUnits: 15,
      extraUnitPrice: 4.5,
      updatedBy: { id: actorId, name: 'Ator Planos' },
    })
    const [change] = await prisma.platformPlanChange.findMany({
      where: { changedById: actorId },
      orderBy: { changedAt: 'desc' },
      take: 1,
    })
    expect(change).toMatchObject({
      accountType: 'INDIVIDUAL',
      previousIncludedUnits: originalIndividualPlan.includedUnits,
      includedUnits: 15,
      changedByName: 'Ator Planos',
    })
    expect(change.previousMonthlyPrice.toNumber()).toBe(
      originalIndividualPlan.monthlyPrice.toNumber(),
    )
    expect(change.monthlyPrice.toNumber()).toBe(59.9)
  })

  it('não grava histórico quando a alteração é recusada', async () => {
    const before = await prisma.platformPlanChange.count({ where: { accountType: 'BROKER' } })

    await patch('BROKER', { monthlyPrice: -1, includedUnits: 1, extraUnitPrice: 1 })

    expect(await prisma.platformPlanChange.count({ where: { accountType: 'BROKER' } })).toBe(before)
  })
})
