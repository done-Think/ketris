import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET } from '../../overview/route'

describe('/api/agency-dashboard/overview — ranking de corretores (integração)', () => {
  const tokenService = new JoseTokenService()
  const brokerIds: string[] = []
  let tenantId: string
  let ownerToken: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Top Brokers', slug: `top-brokers-${randomUUID()}` },
    })
    tenantId = tenant.id

    const owner = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Dona da Imobiliária',
        email: `top-brokers-owner-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'OWNER',
      },
    })
    ownerToken = await tokenService.sign({
      id: owner.id,
      tenantId: owner.tenantId,
      nome: owner.nome,
      email: owner.email,
      papel: owner.papel,
      ativo: owner.ativo,
      vinculoAprovadoEm: owner.vinculoAprovadoEm,
    })

    for (let index = 1; index <= 6; index += 1) {
      const broker = await prisma.usuario.create({
        data: {
          tenantId,
          nome: `Corretor ${index}`,
          email: `top-brokers-${index}-${randomUUID()}@ketris.dev`,
          senhaHash: 'hash-fake',
          papel: 'AGENT',
        },
      })
      brokerIds.push(broker.id)
    }

    async function contract(
      brokerIndex: number,
      valor: number,
      ativadoEm: string,
      status: 'ATIVO' | 'RASCUNHO' = 'ATIVO',
    ) {
      const imovel = await prisma.imovel.create({
        data: {
          tenantId,
          responsavelId: brokerIds[brokerIndex - 1],
          titulo: `Imóvel ${brokerIndex} ${ativadoEm}`,
          finalidade: 'ALUGUEL',
          tipo: 'APARTAMENTO',
          valor,
          status: 'RENTED',
        },
      })
      const oportunidade = await prisma.oportunidade.create({
        data: {
          tenantId,
          imovelId: imovel.id,
          interessadoNome: 'Interessado',
          interessadoEmail: `top-brokers-${randomUUID()}@example.com`,
          valorProposto: valor,
          status: 'ACEITA',
        },
      })
      await prisma.contrato.create({
        data: {
          tenantId,
          imovelId: imovel.id,
          oportunidadeOrigemId: oportunidade.id,
          codigo: `CTR-${randomUUID()}`,
          tipo: 'RESIDENCIAL',
          valor,
          diaVencimento: 5,
          dataInicio: new Date('2026-01-01T00:00:00.000Z'),
          dataFim: new Date('2027-01-01T00:00:00.000Z'),
          indiceReajuste: 'IGPM',
          tipoGarantia: 'CAUCAO',
          status,
          ativadoEm: status === 'ATIVO' ? new Date(ativadoEm) : null,
        },
      })
    }

    // Corretor 1: 4 contratos ativos (3.500) e 1 rascunho que não conta.
    await contract(1, 1000, '2026-09-01T12:00:00.000Z')
    await contract(1, 2000, '2026-09-05T12:00:00.000Z')
    await contract(1, 300, '2026-09-08T12:00:00.000Z')
    await contract(1, 200, '2026-09-10T12:00:00.000Z')
    await contract(1, 99999, '2026-09-11T12:00:00.000Z', 'RASCUNHO')
    // Corretores 2 e 3 empatam em 3.000: vence a ativação mais recente (corretor 2).
    await contract(2, 3000, '2026-09-20T12:00:00.000Z')
    await contract(3, 3000, '2026-08-20T12:00:00.000Z')
    await contract(4, 2000, '2026-09-02T12:00:00.000Z')
    await contract(5, 1500, '2026-09-03T12:00:00.000Z')
    // Corretor 6 fica fora do top 5.
    await contract(6, 100, '2026-09-04T12:00:00.000Z')
  })

  afterAll(async () => {
    if (tenantId) {
      await prisma.contrato.deleteMany({ where: { tenantId } })
      await prisma.oportunidade.deleteMany({ where: { tenantId } })
      await prisma.imovel.deleteMany({ where: { tenantId } })
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    await prisma.$disconnect()
  })

  it('ranqueia por faturamento, limita a 5 e desempata pela ativação mais recente', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/agency-dashboard/overview', {
        headers: { authorization: `Bearer ${ownerToken}` },
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(
      json.topBrokers.map((broker: { name: string; revenueTotal: number; salesCount: number }) => [
        broker.name,
        broker.revenueTotal,
        broker.salesCount,
      ]),
    ).toEqual([
      ['Corretor 1', 3500, 4],
      ['Corretor 2', 3000, 1],
      ['Corretor 3', 3000, 1],
      ['Corretor 4', 2000, 1],
      ['Corretor 5', 1500, 1],
    ])
  })

  it('traz só as 3 vendas mais recentes de cada corretor', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/agency-dashboard/overview', {
        headers: { authorization: `Bearer ${ownerToken}` },
      }),
    )
    const [first] = (await response.json()).topBrokers

    expect(first.recentSales.map((sale: { value: number }) => sale.value)).toEqual([200, 300, 2000])
  })
})
