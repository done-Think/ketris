import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET } from '../../summary/route'

const midNovemberInSaoPaulo = new Date('2026-11-15T15:00:00.000Z')
const lastMinutesOfTheSameDayInSaoPaulo = new Date('2026-11-16T02:30:00.000Z')

describe('/api/financial/summary — próximos vencimentos (integração)', () => {
  const tokenService = new JoseTokenService()
  const tenantIds: string[] = []
  let signOwnerToken: () => Promise<string>

  async function createTenant(label: string) {
    const tenant = await prisma.tenant.create({
      data: { name: `Tenant ${label}`, slug: `upcoming-dues-${label}-${randomUUID()}` },
    })
    tenantIds.push(tenant.id)
    return tenant.id
  }

  async function createCharge(
    tenantId: string,
    [type, status, dueDate]: readonly [
      'RECEIVABLE' | 'PAYABLE',
      'PENDING' | 'PAID' | 'CANCELED',
      string,
    ],
  ) {
    await prisma.charge.create({
      data: {
        tenantId,
        code: `COB-${randomUUID()}`,
        description: `Aluguel ${dueDate}`,
        type,
        amount: 1000,
        dueDate: new Date(`${dueDate}T00:00:00.000Z`),
        status,
        ...(status === 'PAID' ? { paidAt: new Date('2026-11-14T12:00:00.000Z') } : {}),
      },
    })
  }

  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(midNovemberInSaoPaulo)

    const tenantId = await createTenant('owner')
    const otherTenantId = await createTenant('other')

    const owner = await prisma.user.create({
      data: {
        tenantId,
        name: 'Dona',
        email: `upcoming-dues-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'OWNER',
      },
    })
    signOwnerToken = () =>
      tokenService.sign({
        id: owner.id,
        tenantId: owner.tenantId,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        active: owner.active,
        membershipApprovedAt: owner.membershipApprovedAt,
      })

    for (const charge of [
      ['RECEIVABLE', 'PENDING', '2026-10-30'],
      ['RECEIVABLE', 'PENDING', '2026-11-14'],
      ['RECEIVABLE', 'PENDING', '2026-12-05'],
      ['RECEIVABLE', 'PENDING', '2026-11-15'],
      ['RECEIVABLE', 'PENDING', '2026-11-20'],
      ['RECEIVABLE', 'PAID', '2026-11-16'],
      ['RECEIVABLE', 'CANCELED', '2026-11-17'],
      ['PAYABLE', 'PENDING', '2026-11-18'],
    ] as const) {
      await createCharge(tenantId, charge)
    }
    await createCharge(otherTenantId, ['RECEIVABLE', 'PENDING', '2026-11-16'])
  })

  afterAll(async () => {
    vi.useRealTimers()
    for (const id of tenantIds) await prisma.tenant.delete({ where: { id } })
    await prisma.$disconnect()
  })

  async function upcomingDueDates() {
    const response = await GET(
      new NextRequest('http://localhost/api/financial/summary', {
        headers: { authorization: `Bearer ${await signOwnerToken()}` },
      }),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { upcomingDues: { dueDate: string }[] }
    return body.upcomingDues.map((due) => due.dueDate.slice(0, 10))
  }

  it('lista só as cobranças a receber que vencem de hoje em diante, da mais próxima à mais distante', async () => {
    vi.setSystemTime(midNovemberInSaoPaulo)

    expect(await upcomingDueDates()).toEqual(['2026-11-15', '2026-11-20', '2026-12-05'])
  })

  it('mantém a cobrança que vence hoje até o fim do dia em São Paulo', async () => {
    vi.setSystemTime(lastMinutesOfTheSameDayInSaoPaulo)

    expect(await upcomingDueDates()).toEqual(['2026-11-15', '2026-11-20', '2026-12-05'])
  })
})
