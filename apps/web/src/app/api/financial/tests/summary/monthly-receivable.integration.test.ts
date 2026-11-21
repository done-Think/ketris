import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST as registerPayment } from '../../charges/[id]/payment/route'
import { GET } from '../../summary/route'

const midNovemberInSaoPaulo = new Date('2026-11-15T15:00:00.000Z')

describe('/api/financial/summary — a receber no mês (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let ownerToken: string
  let pendingChargeId: string

  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(midNovemberInSaoPaulo)

    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Monthly Receivable', slug: `monthly-receivable-${randomUUID()}` },
    })
    tenantId = tenant.id

    const owner = await prisma.user.create({
      data: {
        tenantId,
        name: 'Dona',
        email: `monthly-receivable-${randomUUID()}@ketris.dev`,
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

    for (const [amount, type, status, dueDate] of [
      [100, 'RECEIVABLE', 'PENDING', '2026-11-10'],
      [200, 'RECEIVABLE', 'SCHEDULED', '2026-11-20'],
      [400, 'RECEIVABLE', 'PAID', '2026-11-05'],
      [800, 'RECEIVABLE', 'CANCELED', '2026-11-25'],
      [1600, 'PAYABLE', 'PENDING', '2026-11-12'],
      [3200, 'RECEIVABLE', 'PENDING', '2026-10-30'],
    ] as const) {
      const charge = await prisma.charge.create({
        data: {
          tenantId,
          code: `COB-${randomUUID()}`,
          description: 'Aluguel',
          type,
          amount,
          dueDate: new Date(`${dueDate}T00:00:00.000Z`),
          status,
          ...(status === 'PAID' ? { paidAt: new Date('2026-11-05T12:00:00.000Z') } : {}),
        },
      })
      if (amount === 100) pendingChargeId = charge.id
    }
  })

  afterAll(async () => {
    vi.useRealTimers()
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  async function monthlyReceivable() {
    const response = await GET(
      new NextRequest('http://localhost/api/financial/summary', {
        headers: { authorization: `Bearer ${ownerToken}` },
      }),
    )
    return (await response.json()).monthlyReceivable
  }

  it('soma só o que ainda falta receber no mês: pendente e agendado', async () => {
    expect(await monthlyReceivable()).toBe(300)
  })

  it('diminui quando uma cobrança do mês é paga', async () => {
    const response = await registerPayment(
      new NextRequest(`http://localhost/api/financial/charges/${pendingChargeId}/payment`, {
        method: 'POST',
        headers: { authorization: `Bearer ${ownerToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ paidAt: '2026-11-15', paymentMethod: 'PIX' }),
      }),
      { params: Promise.resolve({ id: pendingChargeId }) },
    )

    expect(response.status).toBe(200)
    expect(await monthlyReceivable()).toBe(200)
  })
})
