import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET } from '../../overview/route'

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

    async function createUserAndToken(papel: 'OWNER' | 'AGENT' | 'RENTER', ativo = true) {
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

    const admin = await createUserAndToken('OWNER')
    adminToken = admin.token

    const agent = await createUserAndToken('AGENT')
    agentToken = agent.token
    brokerId = agent.user.id
    brokerName = agent.user.nome

    const renter = await createUserAndToken('RENTER')
    renterToken = renter.token

    await createUserAndToken('AGENT', false)

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    const currentMonthDate = (day: number) => new Date(currentYear, currentMonth, day)

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
          dataInicio: currentMonthDate(1),
          dataFim: new Date(currentYear + 1, currentMonth, 1),
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
      currentMonthDate(20),
    )
    await activateContract(propertyWithoutAddressId, 2000, currentMonthDate(10))

    await prisma.cobranca.create({
      data: {
        tenantId,
        contratoId: contractWithAddress.id,
        codigo: `COB-${randomUUID()}`,
        tipo: 'A_RECEBER',
        valor: 1500,
        vencimento: currentMonthDate(25),
        status: 'PENDENTE',
      },
    })

    await prisma.eventoAgenda.create({
      data: {
        tenantId,
        responsavelId: brokerId,
        titulo: 'Visita agendada ao Apartamento Batel',
        tipo: 'VISIT',
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

  it('retorna 200 para OWNER', async () => {
    const response = await GET(buildRequest(adminToken))

    expect(response.status).toBe(200)
  })

  it('retorna a agregação completa para OWNER', async () => {
    const response = await GET(buildRequest(ownerToken))
    const json = await response.json()

    expect(response.status).toBe(200)

    expect(json.kpis.portfolioCount).toBe(4)
    expect(json.kpis.activeBrokersCount).toBe(3)
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

  it('não mistura dados de outra imobiliária, em nenhum dos dois sentidos', async () => {
    const before = await (await GET(buildRequest(ownerToken))).json()
    const otherTenant = await prisma.tenant.create({
      data: { nome: 'Outra Imobiliária', slug: `outra-imobiliaria-${randomUUID()}` },
    })

    try {
      const [otherOwner, otherBroker] = await Promise.all(
        (['OWNER', 'AGENT'] as const).map((papel) =>
          prisma.usuario.create({
            data: {
              tenantId: otherTenant.id,
              nome: `Outro ${papel}`,
              email: `outro-${papel.toLowerCase()}-${randomUUID()}@ketris.dev`,
              senhaHash: 'hash-fake',
              papel,
            },
          }),
        ),
      )
      await prisma.imovel.create({
        data: {
          tenantId: otherTenant.id,
          responsavelId: otherBroker.id,
          titulo: 'Imóvel da Outra Imobiliária',
          finalidade: 'VENDA',
          tipo: 'casa',
          valor: 900000,
          status: 'SOLD',
        },
      })
      await prisma.lead.create({
        data: {
          tenantId: otherTenant.id,
          responsavelId: otherBroker.id,
          nome: 'Lead da Outra Imobiliária',
          telefone: '41988880000',
          interesse: 'Casa',
          orcamento: '900000',
          origem: 'Portal Ketris',
        },
      })

      const after = await (await GET(buildRequest(ownerToken))).json()
      expect(after.kpis).toEqual(before.kpis)
      expect(after.topBrokers).toEqual(before.topBrokers)
      expect(JSON.stringify(after)).not.toContain('Outra Imobiliária')

      const otherOwnerToken = await tokenService.sign({
        id: otherOwner.id,
        tenantId: otherOwner.tenantId,
        nome: otherOwner.nome,
        email: otherOwner.email,
        papel: otherOwner.papel,
        ativo: otherOwner.ativo,
        vinculoAprovadoEm: otherOwner.vinculoAprovadoEm,
      })
      const other = await (await GET(buildRequest(otherOwnerToken))).json()
      expect(other.kpis).toMatchObject({
        portfolioCount: 1,
        // The owner also counts as an active broker.
        activeBrokersCount: 2,
        receivedLeadsThisMonth: 1,
        monthlyReceivable: 0,
      })
      // No closed sales in this tenant: the first tenant's ranking must not leak into it.
      expect(other.topBrokers).toEqual([])
      expect(JSON.stringify(other)).not.toContain(brokerName)
    } finally {
      await prisma.tenant.delete({ where: { id: otherTenant.id } })
    }
  })

  it('retorna os dados de comparação com o mês anterior', async () => {
    const now = new Date()
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthDate = (day: number) => new Date(now.getFullYear(), now.getMonth() - 1, day)

    await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: brokerId,
        titulo: 'Casa Cadastrada Há Dois Meses',
        finalidade: 'VENDA',
        tipo: 'casa',
        valor: 1000,
        status: 'DRAFT',
        createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 5),
      },
    })

    await prisma.lead.create({
      data: {
        tenantId,
        responsavelId: brokerId,
        nome: 'Lead Do Mês Passado',
        telefone: '41999990002',
        interesse: 'Apartamento',
        orcamento: '1000-2000',
        origem: 'Portal Ketris',
        createdAt: previousMonthStart,
      },
    })

    for (const [valor, status] of [
      [1000, 'PAGA'],
      [400, 'PENDENTE'],
      [999, 'CANCELADA'],
      [700, 'ATRASADA'],
    ] as const) {
      await prisma.cobranca.create({
        data: {
          tenantId,
          codigo: `COB-${randomUUID()}`,
          tipo: 'A_RECEBER',
          valor,
          vencimento: previousMonthDate(10),
          status,
        },
      })
    }

    const response = await GET(buildRequest(ownerToken))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.kpis.newPropertiesThisMonth).toBe(4)
    expect(json.kpis.portfolioCount).toBe(5)
    expect(json.kpis.receivedLeadsThisMonth).toBe(1)
    expect(json.kpis.receivedLeadsPreviousPeriod).toBe(1)
    expect(json.kpis.monthlyReceivable).toBe(1500)
    expect(json.kpis.monthlyReceivablePreviousMonth).toBe(1400)
  })

  describe('limites dos períodos de comparação (relógio em 13/01/2027 14:00)', () => {
    const tenantIds: string[] = []
    let frozenOwnerToken: string

    async function createTenantWithOwner(label: string) {
      const tenant = await prisma.tenant.create({
        data: { nome: `Tenant ${label}`, slug: `agency-dashboard-${label}-${randomUUID()}` },
      })
      tenantIds.push(tenant.id)
      const owner = await prisma.usuario.create({
        data: {
          tenantId: tenant.id,
          nome: `Owner ${label}`,
          email: `owner-${randomUUID()}@ketris.dev`,
          senhaHash: 'hash-fake',
          papel: 'OWNER',
        },
      })

      return { tenant, owner }
    }

    async function seedComparisonData(tenantId: string, ownerId: string) {
      for (const [index, createdAt] of [
        new Date(2026, 11, 1, 0, 0),
        new Date(2026, 11, 13, 13, 59),
        new Date(2026, 11, 13, 14, 0),
        new Date(2026, 11, 20),
        new Date(2026, 10, 30, 23, 59),
        new Date(2027, 0, 2),
        new Date(2027, 0, 13, 13, 0),
      ].entries()) {
        await prisma.lead.create({
          data: {
            tenantId,
            responsavelId: ownerId,
            nome: `Lead ${index}`,
            telefone: '41999990000',
            interesse: 'Apartamento',
            orcamento: '1000-2000',
            origem: 'Portal Ketris',
            createdAt,
          },
        })
      }

      for (const [index, createdAt] of [
        new Date(2027, 0, 1, 0, 0),
        new Date(2026, 11, 31, 23, 59, 59),
        new Date(2027, 0, 10),
      ].entries()) {
        await prisma.imovel.create({
          data: {
            tenantId,
            responsavelId: ownerId,
            titulo: `Imóvel ${index}`,
            finalidade: 'VENDA',
            tipo: 'casa',
            valor: 1000,
            status: 'DRAFT',
            createdAt,
          },
        })
      }

      for (const [valor, tipo, status, vencimento] of [
        [100, 'A_RECEBER', 'PAGA', new Date(2026, 11, 1, 0, 0)],
        [200, 'A_RECEBER', 'PENDENTE', new Date(2026, 11, 31, 23, 59)],
        [4000, 'A_RECEBER', 'PENDENTE', new Date(2027, 0, 1, 0, 0)],
        [8000, 'A_RECEBER', 'PAGA', new Date(2026, 10, 30, 23, 59)],
        [16000, 'A_PAGAR', 'PAGA', new Date(2026, 11, 15)],
        [32000, 'A_RECEBER', 'AGENDADA', new Date(2026, 11, 15)],
        [64000, 'A_RECEBER', 'ATRASADA', new Date(2026, 11, 15)],
        [128000, 'A_RECEBER', 'CANCELADA', new Date(2026, 11, 15)],
      ] as const) {
        await prisma.cobranca.create({
          data: { tenantId, codigo: `COB-${randomUUID()}`, tipo, valor, vencimento, status },
        })
      }
    }

    beforeAll(async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(2027, 0, 13, 14, 0))

      const { tenant, owner } = await createTenantWithOwner('frozen')
      await seedComparisonData(tenant.id, owner.id)

      // Another tenant with the same data must not leak into the counts.
      const other = await createTenantWithOwner('other')
      await seedComparisonData(other.tenant.id, other.owner.id)

      frozenOwnerToken = await tokenService.sign({
        id: owner.id,
        tenantId: owner.tenantId,
        nome: owner.nome,
        email: owner.email,
        papel: owner.papel,
        ativo: owner.ativo,
        vinculoAprovadoEm: owner.vinculoAprovadoEm,
      })
    })

    afterAll(async () => {
      vi.useRealTimers()
      await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    })

    it('conta só os leads do mesmo trecho de dezembro, na virada de ano', async () => {
      const json = await (await GET(buildRequest(frozenOwnerToken))).json()

      expect(json.kpis.receivedLeadsThisMonth).toBe(2)
      expect(json.kpis.receivedLeadsPreviousPeriod).toBe(2)
    })

    it('conta como novos só os imóveis criados a partir de 1º de janeiro', async () => {
      const json = await (await GET(buildRequest(frozenOwnerToken))).json()

      expect(json.kpis.portfolioCount).toBe(3)
      expect(json.kpis.newPropertiesThisMonth).toBe(2)
    })

    it('soma no mês anterior só cobranças a receber pendentes ou pagas com vencimento em dezembro', async () => {
      const json = await (await GET(buildRequest(frozenOwnerToken))).json()

      expect(json.kpis.monthlyReceivable).toBe(4000)
      expect(json.kpis.monthlyReceivablePreviousMonth).toBe(300)
    })
  })
})
