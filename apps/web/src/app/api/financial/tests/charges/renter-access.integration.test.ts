import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { GET, POST } from '../../charges/route'
import { GET as getCharge, PATCH, DELETE } from '../../charges/[id]/route'
import { POST as registerPayment } from '../../charges/[id]/payment/route'
import { GET as getSummary } from '../../summary/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('Renter charge isolation (database integration)', () => {
  const tenantIds: string[] = []
  const tokens = new JoseTokenService()
  let renterToken: string
  let agentToken: string
  let ownerToken: string
  let ownIds: string[]
  let hiddenIds: string[]

  beforeAll(async () => {
    async function tenant() {
      const row = await prisma.tenant.create({
        data: { nome: 'Charge isolation', slug: randomUUID() },
      })
      tenantIds.push(row.id)
      return row.id
    }
    const tenantId = await tenant()
    const foreignTenantId = await tenant()
    async function user(tenantId: string, papel: 'RENTER' | 'AGENT' | 'OWNER') {
      return prisma.usuario.create({
        data: {
          tenantId,
          papel,
          nome: papel,
          email: `${randomUUID()}@test.invalid`,
          senhaHash: 'test',
        },
      })
    }
    const renter = await user(tenantId, 'RENTER')
    const otherRenter = await user(tenantId, 'RENTER')
    const agent = await user(tenantId, 'AGENT')
    const foreignAgent = await user(foreignTenantId, 'AGENT')
    renterToken = await tokens.sign(renter)
    agentToken = await tokens.sign(agent)
    ownerToken = await tokens.sign(await user(tenantId, 'OWNER'))

    async function contract(
      tenantId: string,
      agentId: string,
      usuarioId: string | null,
      papel: 'LOCATARIO' | 'LOCADOR' = 'LOCATARIO',
    ) {
      const property = await prisma.imovel.create({
        data: {
          tenantId,
          responsavelId: agentId,
          titulo: 'Rental',
          finalidade: 'ALUGUEL',
          tipo: 'APARTAMENTO',
          valor: 1000,
        },
      })
      const opportunity = await prisma.oportunidade.create({
        data: {
          tenantId,
          imovelId: property.id,
          responsavelId: await propertyResponsibleId(prisma, property.id),
          interessadoNome: 'Renter',
          interessadoEmail: renter.email,
          valorProposto: 1000,
          status: 'ACEITA',
        },
      })
      return prisma.contrato.create({
        data: {
          tenantId,
          imovelId: property.id,
          oportunidadeOrigemId: opportunity.id,
          codigo: randomUUID(),
          valor: 1000,
          diaVencimento: 5,
          dataInicio: new Date('2026-01-01'),
          dataFim: new Date('2027-01-01'),
          indiceReajuste: 'IPCA',
          tipoGarantia: 'CAUCAO',
          status: 'ATIVO',
          partes: {
            create: { papel, usuarioId, nome: 'Renter', cpf: '12345678900', email: renter.email },
          },
        },
      })
    }
    const own = await contract(tenantId, agent.id, renter.id)
    const unrelated = await contract(tenantId, agent.id, otherRenter.id)
    const unlinked = await contract(tenantId, agent.id, null)
    const wrongRole = await contract(tenantId, agent.id, renter.id, 'LOCADOR')
    const foreign = await contract(foreignTenantId, foreignAgent.id, renter.id)
    async function charge(
      tenantId: string,
      contratoId: string | null,
      tipo: 'A_RECEBER' | 'A_PAGAR' = 'A_RECEBER',
      overdue = false,
    ) {
      return prisma.cobranca.create({
        data: {
          tenantId,
          contratoId,
          tipo,
          status: 'PENDENTE',
          codigo: randomUUID(),
          descricao: 'isolation-charge',
          valor: 1000,
          vencimento: new Date(overdue ? '2026-10-05' : '2099-10-05'),
        },
      })
    }
    ownIds = [
      (await charge(tenantId, own.id)).id,
      (await charge(tenantId, own.id, 'A_RECEBER', true)).id,
      (await charge(foreignTenantId, foreign.id)).id,
    ]
    hiddenIds = [
      (await charge(tenantId, own.id, 'A_PAGAR')).id,
      (await charge(tenantId, unrelated.id)).id,
      (await charge(tenantId, unlinked.id)).id,
      (await charge(tenantId, wrongRole.id)).id,
      (await charge(tenantId, null)).id,
    ]
  })

  afterAll(async () => {
    const where = { tenantId: { in: tenantIds } }
    await prisma.cobranca.deleteMany({ where })
    await prisma.contrato.deleteMany({ where })
    await prisma.oportunidade.deleteMany({ where })
    await prisma.imovel.deleteMany({ where })
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    await prisma.$disconnect()
  })

  function request(path: string, method = 'GET', body?: unknown, token = renterToken) {
    return new NextRequest(`http://localhost/api/financial/${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  }
  const context = (id: string) => ({ params: Promise.resolve({ id }) })

  it('lists only linked receivables and scopes search, counts, status and pagination', async () => {
    const first = await GET(request('charges?pageSize=1&search=isolation-charge&type=A_RECEBER'))
    expect(first.status).toBe(200)
    const firstBody = await first.json()
    expect(firstBody.totalCount).toBe(3)
    expect(firstBody.items).toHaveLength(1)
    expect(ownIds).toContain(firstBody.items[0].id)
    const second = await GET(request('charges?pageSize=1&page=2&search=isolation-charge'))
    const secondBody = await second.json()
    expect(secondBody.totalCount).toBe(3)
    expect(secondBody.items).toHaveLength(1)
    expect(secondBody.items[0].id).not.toBe(firstBody.items[0].id)
    expect(ownIds).toContain(secondBody.items[0].id)
    const third = await GET(request('charges?pageSize=1&page=3&search=isolation-charge'))
    const thirdBody = await third.json()
    expect(thirdBody.totalCount).toBe(3)
    expect([firstBody.items[0].id, secondBody.items[0].id, thirdBody.items[0].id].sort()).toEqual(
      ownIds.slice().sort(),
    )
    const payable = await GET(request('charges?type=A_PAGAR'))
    expect(await payable.json()).toMatchObject({ items: [], totalCount: 0 })
    const overdue = await GET(request('charges?status=ATRASADA'))
    expect((await overdue.json()).totalCount).toBe(1)
    const noMatch = await GET(request('charges?search=not-present'))
    expect(await noMatch.json()).toMatchObject({ items: [], totalCount: 0 })
  })

  it('reads linked details across agencies and hides third-party, unlinked, wrong-role and payable charges', async () => {
    for (const id of ownIds) {
      const response = await getCharge(request(`charges/${id}`), context(id))
      expect(response.status).toBe(200)
      expect((await response.json()).charge.id).toBe(id)
    }
    for (const id of [...hiddenIds, 'missing']) {
      const response = await getCharge(request(`charges/${id}`), context(id))
      expect(response.status).toBe(404)
    }
  })

  it('blocks all renter writes and the tenant financial summary', async () => {
    const id = ownIds[0]
    const body = {
      description: 'Denied',
      type: 'A_RECEBER',
      amount: 100,
      dueDate: '2026-10-05',
      status: 'PENDENTE',
    }
    expect((await POST(request('charges', 'POST', body))).status).toBe(403)
    expect(
      (await PATCH(request(`charges/${id}`, 'PATCH', { amount: 100 }), context(id))).status,
    ).toBe(403)
    expect((await DELETE(request(`charges/${id}`, 'DELETE'), context(id))).status).toBe(403)
    expect(
      (
        await registerPayment(
          request(`charges/${id}/payment`, 'POST', { paidAt: '2026-10-05', paymentMethod: 'PIX' }),
          context(id),
        )
      ).status,
    ).toBe(403)
    expect((await getSummary(request('summary'))).status).toBe(403)
    expect(await prisma.cobranca.findUnique({ where: { id } })).toMatchObject({
      status: 'PENDENTE',
      pagoEm: null,
    })
  })

  it('preserves tenant scope for owners and blocks agents', async () => {
    const response = await GET(request('charges', 'GET', undefined, ownerToken))
    expect(response.status).toBe(200)
    expect((await response.json()).totalCount).toBe(7)
    expect((await GET(request('charges', 'GET', undefined, agentToken))).status).toBe(403)
  })
})
