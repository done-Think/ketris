import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { DELETE as deleteCharge } from '../../charges/[id]/route'
import { POST } from '../../charges/route'

// Regressão: o código era `COB-{ano}-{count + 1}`. Excluir uma cobrança diminuía o count e o
// próximo código repetia um já existente; pedidos simultâneos também calculavam o mesmo número
// (unique constraint → 500).
describe('/api/financial/charges — sequência de códigos (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let actorToken: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Charge Codes', slug: `charge-codes-${randomUUID()}` },
    })
    tenantId = tenant.id

    const actor = await prisma.user.create({
      data: {
        tenantId,
        name: 'Administrador',
        email: `corretor-codes-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'OWNER',
      },
    })
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      name: actor.name,
      email: actor.email,
      role: actor.role,
      active: actor.active,
      membershipApprovedAt: actor.membershipApprovedAt,
    })
  })

  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  async function createCharge(): Promise<{ status: number; id?: string; code?: string }> {
    const response = await POST(
      new NextRequest('http://localhost/api/financial/charges', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Conta de água',
          type: 'PAYABLE',
          amount: 90,
          dueDate: '2026-11-10',
          status: 'PENDING',
        }),
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${actorToken}` },
      }),
    )
    const json = await response.json()

    return { status: response.status, id: json.charge?.id, code: json.charge?.code }
  }

  it('gera um código livre depois que uma cobrança anterior é excluída', async () => {
    const first = await createCharge()
    const second = await createCharge()
    expect(first.status).toBe(201)
    expect(second.status).toBe(201)

    const deleteResponse = await deleteCharge(
      new NextRequest(`http://localhost/api/financial/charges/${first.id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${actorToken}` },
      }),
      { params: Promise.resolve({ id: first.id as string }) },
    )
    expect(deleteResponse.status).toBe(204)

    const third = await createCharge()

    expect(third.status).toBe(201)
    expect(third.code).not.toBe(second.code)
  })

  it('gera códigos distintos para cobranças criadas ao mesmo tempo', async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => createCharge()))

    expect(results.map((result) => result.status)).toEqual(Array(6).fill(201))
    expect(new Set(results.map((result) => result.code)).size).toBe(6)
  })
})
