import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET } from './route'

describe('/api/agency-dashboard/overview (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let ownerToken: string
  let adminToken: string
  let agentToken: string
  let renterToken: string
  let brokerId: string
  let brokerName: string
  let propertyWithAddressId: string
  let propertyWithoutAddressId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Agency Dashboard', slug: `agency-dashboard-${randomUUID()}` },
    })
    tenantId = tenant.id

    async function createUserAndToken(papel: 'OWNER' | 'ADMIN' | 'AGENT' | 'RENTER', ativo = true) {
      const user = await prisma.usuario.create({
        data: {
          tenantId,
          nome: `Usuário ${papel} ${randomUUID()}`,
          email: `${papel.toLowerCase()}-${randomUUID()}@ketris.dev`,
          senhaHash: 'hash-fake',
          papel,
          ativo,
        },
      })
      const token = await tokenService.sign({
        id: user.id,
        tenantId: user.tenantId,
        nome: user.nome,
        email: user.email,
        papel: user.papel,
        ativo: user.ativo,
        vinculoAprovadoEm: user.vinculoAprovadoEm,
      })

      return { user, token }
    }

    const owner = await createUserAndToken('OWNER')
    ownerToken = owner.token

    const admin = await createUserAndToken('ADMIN')
    adminToken = admin.token

    const agent = await createUserAndToken('AGENT')
    agentToken = agent.token
    brokerId = agent.user.id
    brokerName = agent.user.nome

    const renter = await createUserAndToken('RENTER')
    renterToken = renter.token

    await createUserAndToken('AGENT', false)

    await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: brokerId,
        titulo: 'Apartamento Publicado',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 2000,
        status: 'PUBLISHED',
      },
    })

    const rentedProperty = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: brokerId,
        titulo: 'Apartamento Batel',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 3000,
        status: 'RENTED',
        endereco: {
          create: {
            logradouro: 'Rua das Flores',
            numero: '100',
            bairro: 'Batel',
            cidade: 'Curitiba',
            estado: 'PR',
            cep: '80420-000',
          },
        },
      },
    })
    propertyWithAddressId = rentedProperty.id

    const soldProperty = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: brokerId,
        titulo: 'Casa Vendida Sem Endereço',
        finalidade: 'VENDA',
        tipo: 'casa',
        valor: 2000,
        status: 'SOLD',
      },
    })
    propertyWithoutAddressId = soldProperty.id

    await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: brokerId,
        titulo: 'Casa Rascunho',
        finalidade: 'VENDA',
        tipo: 'casa',
        valor: 1000,
        status: 'DRAFT',
      },
    })

    await prisma.lead.create({
      data: {
        tenantId,
        responsavelId: brokerId,
        nome: 'Lead Recente',
        telefone: '41999990000',
        interesse: 'Apartamento 2 quartos',
        orcamento: '2000-3000',
        origem: 'Portal Ketris',
      },
    })

    await prisma.lead.create({
      data: {
        tenantId,
        responsavelId: brokerId,
        nome: 'Lead Antigo',
        telefone: '41999990001',
        interesse: 'Casa',
        orcamento: '1000-2000',
        origem: 'Indicação',
        createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 10),
      },
    })

    async function activateContract(imovelId: string, valor: number, ativadoEm: Date) {
      const opportunity = await prisma.oportunidade.create({
        data: {
          tenantId,
          imovelId,
          interessadoNome: 'Interessado Teste',
          interessadoEmail: `interessado-${randomUUID()}@example.com`,
          valorProposto: valor,
          status: 'ACEITA',
        },
      })

      return prisma.contrato.create({
        data: {
          tenantId,
          imovelId,
          oportunidadeOrigemId: opportunity.id,
          codigo: `CTR-${randomUUID()}`,
          tipo: 'RESIDENCIAL',
          valor,
          diaVencimento: 5,
          dataInicio: new Date('2026-09-01'),
          dataFim: new Date('2027-09-01'),
          indiceReajuste: 'IGPM',
          tipoGarantia: 'CAUCAO',
          status: 'ATIVO',
          ativadoEm,
        },
      })
    }

    const contractWithAddress = await activateContract(
      propertyWithAddressId,
      3000,
      new Date('2026-09-20'),
    )
    await activateContract(propertyWithoutAddressId, 2000, new Date('2026-09-10'))

    const now = new Date()

    await prisma.cobranca.create({
      data: {
        tenantId,
        contratoId: contractWithAddress.id,
        codigo: `COB-${randomUUID()}`,
        tipo: 'A_RECEBER',
        valor: 1500,
        vencimento: new Date(now.getFullYear(), now.getMonth(), 25),
        status: 'PENDENTE',
      },
    })

    await prisma.eventoAgenda.create({
      data: {
        tenantId,
        responsavelId: brokerId,
        titulo: 'Visita agendada ao Apartamento Batel',
        inicio: new Date('2026-09-28T14:00:00.000Z'),
        fim: new Date('2026-09-28T15:00:00.000Z'),
        participanteNome: 'Cliente Interessado',
        participanteTelefone: '41988887777',
      },
    })
  })

  afterAll(async () => {
    if (tenantId) {
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    await prisma.$disconnect()
  })

  function buildRequest(token?: string): NextRequest {
    return new NextRequest('http://localhost/api/agency-dashboard/overview', {
      method: 'GET',
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest())

    expect(response.status).toBe(401)
  })

  it('retorna 403 quando um AGENT tenta ver a visão geral da agência', async () => {
    const response = await GET(buildRequest(agentToken))
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('retorna 403 quando um RENTER tenta ver a visão geral da agência', async () => {
    const response = await GET(buildRequest(renterToken))

    expect(response.status).toBe(403)
  })

  it('retorna 200 para ADMIN', async () => {
    const response = await GET(buildRequest(adminToken))

    expect(response.status).toBe(200)
  })

  it('retorna a agregação completa para OWNER', async () => {
    const response = await GET(buildRequest(ownerToken))
    const json = await response.json()

    expect(response.status).toBe(200)

    expect(json.kpis.portfolioCount).toBe(4)
    expect(json.kpis.activeBrokersCount).toBe(2)
    expect(json.kpis.receivedLeadsThisMonth).toBe(1)
    expect(json.kpis.monthlyReceivable).toBe(1500)
    expect(json.kpis.occupancyPercentage).toBe(67)

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const currentMonthEntry = json.revenueSeries.find(
      (entry: { year: number; month: number }) =>
        entry.year === currentYear && entry.month === currentMonth,
    )
    expect(currentMonthEntry?.total).toBe(1500)
    expect(json.revenueSeries.every((entry: unknown) => !('target' in (entry as object)))).toBe(
      true,
    )

    expect(json.topBrokers).toHaveLength(1)
    const [broker] = json.topBrokers
    expect(broker.id).toBe(brokerId)
    expect(broker.name).toBe(brokerName)
    expect(broker.salesCount).toBe(2)
    expect(broker.revenueTotal).toBe(5000)
    expect(broker.recentSales).toHaveLength(2)
    expect(broker.recentSales[0].propertyId).toBe(propertyWithAddressId)
    expect(broker.recentSales[0].location).toBe('Batel, Curitiba')
    expect(broker.recentSales[1].propertyId).toBe(propertyWithoutAddressId)
    expect(broker.recentSales[1].location).toBeNull()

    expect(json.recentActivities.length).toBeGreaterThan(0)
    expect(json.recentActivities.length).toBeLessThanOrEqual(10)
    const occurredAtValues = json.recentActivities.map((activity: { occurredAt: string }) =>
      new Date(activity.occurredAt).getTime(),
    )
    const sortedDesc = [...occurredAtValues].sort((a, b) => b - a)
    expect(occurredAtValues).toEqual(sortedDesc)

    const visitActivity = json.recentActivities.find(
      (activity: { type: string }) => activity.type === 'VISIT',
    )
    expect(visitActivity?.brokerName).toBe(brokerName)
    expect(visitActivity?.detail).toBe('Visita agendada ao Apartamento Batel')

    const leadActivity = json.recentActivities.find(
      (activity: { type: string; detail: string }) =>
        activity.type === 'LEAD' && activity.detail === 'Lead Recente',
    )
    expect(leadActivity?.brokerName).toBe(brokerName)
  })
})
