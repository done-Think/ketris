import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET } from '../../summary/route'

// 31/10/2026 às 22:00 em São Paulo = 01/11/2026 01:00 UTC. Num servidor UTC o mês já teria virado.
const lateOnOctober31InSaoPaulo = new Date('2026-11-01T01:00:00.000Z')

describe('/api/financial/summary — virada de mês (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let ownerToken: string

  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(lateOnOctober31InSaoPaulo)

    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Financial Month', slug: `financial-month-${randomUUID()}` },
    })
    tenantId = tenant.id

    const owner = await prisma.user.create({
      data: {
        tenantId,
        name: 'Dona',
        email: `financial-month-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'OWNER',
      },
    })
    ownerToken = await tokenService.sign({
      id: owner.id,
      tenantId: owner.tenantId,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      active: owner.active,
      membershipApprovedAt: owner.membershipApprovedAt,
    })

    // Vencimentos são datas de calendário (YYYY-MM-DD), gravadas às 00:00 UTC.
    for (const [amount, dueDate] of [
      [100, '2026-10-01'],
      [200, '2026-10-31'],
      [400, '2026-11-01'],
      [800, '2026-05-01'],
      [1600, '2026-04-30'],
    ] as const) {
      await prisma.charge.create({
        data: {
          tenantId,
          code: `COB-${randomUUID()}`,
          description: 'Aluguel',
          type: 'RECEIVABLE',
          amount,
          dueDate: new Date(`${dueDate}T00:00:00.000Z`),
          status: 'PENDING',
        },
      })
    }
  })

  afterAll(async () => {
    vi.useRealTimers()
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  async function getSummary() {
    const response = await GET(
      new NextRequest('http://localhost/api/financial/summary', {
        headers: { authorization: `Bearer ${ownerToken}` },
      }),
    )

    return { status: response.status, body: await response.json() }
  }

  it('às 22h do dia 31 em São Paulo ainda soma os vencimentos de outubro, do dia 1º ao 31', async () => {
    const { status, body } = await getSummary()

    expect(status).toBe(200)
    expect(body.monthlyReceivable).toBe(300)
  })

  it('a série termina em outubro e começa em maio, com cada vencimento no mês do calendário', async () => {
    const { body } = await getSummary()

    expect(body.monthlySeries).toEqual([
      { year: 2026, month: 5, total: 800 },
      { year: 2026, month: 6, total: 0 },
      { year: 2026, month: 7, total: 0 },
      { year: 2026, month: 8, total: 0 },
      { year: 2026, month: 9, total: 0 },
      { year: 2026, month: 10, total: 300 },
    ])
  })
})
