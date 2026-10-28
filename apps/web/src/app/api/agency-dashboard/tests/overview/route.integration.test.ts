import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { calendarMonthInTimeZone } from '@server/shared/time-zone-calendar'

import { GET } from '../../overview/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

// Instante em horário de São Paulo (UTC-3, sem horário de verão desde 2019): os meses do
// dashboard seguem esse fuso, qualquer que seja o fuso da máquina que roda o teste.
const saoPaulo = (year: number, month: number, day: number, hour = 0, minute = 0, second = 0) =>
  new Date(Date.UTC(year, month, day, hour + 3, minute, second))
// Data de calendário (vencimento, início de contrato): gravada às 00:00 UTC.
const calendarDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day))

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
      data: { name: 'Tenant Agency Dashboard', slug: `agency-dashboard-${randomUUID()}` },
    })
    tenantId = tenant.id

    async function createUserAndToken(role: 'OWNER' | 'AGENT' | 'RENTER', active = true) {
      const user = await prisma.user.create({
        data: {
          tenantId,
          name: `Usuário ${role} ${randomUUID()}`,
          email: `${role.toLowerCase()}-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role,
          active,
        },
      })
      const token = await tokenService.sign({
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        membershipApprovedAt: user.membershipApprovedAt,
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
    brokerName = agent.user.name

    const renter = await createUserAndToken('RENTER')
    renterToken = renter.token

    await createUserAndToken('AGENT', false)

    const { year: currentYear, month: currentMonth } = calendarMonthInTimeZone(new Date())

    await prisma.property.create({
      data: {
        tenantId,
        responsibleId: brokerId,
        title: 'Apartamento Publicado',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 2000,
        status: 'PUBLISHED',
      },
    })

    const rentedProperty = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: brokerId,
        title: 'Apartamento Batel',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 3000,
        status: 'RENTED',
        address: {
          create: {
            street: 'Rua das Flores',
            number: '100',
            neighborhood: 'Batel',
            city: 'Curitiba',
            state: 'PR',
            zipCode: '80420-000',
          },
        },
      },
    })
    propertyWithAddressId = rentedProperty.id

    const soldProperty = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: brokerId,
        title: 'Casa Vendida Sem Endereço',
        purpose: 'SALE',
        type: 'HOUSE',
        price: 2000,
        status: 'SOLD',
      },
    })
    propertyWithoutAddressId = soldProperty.id

    await prisma.property.create({
      data: {
        tenantId,
        responsibleId: brokerId,
        title: 'Casa Rascunho',
        purpose: 'SALE',
        type: 'HOUSE',
        price: 1000,
        status: 'DRAFT',
      },
    })

    await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: brokerId,
        name: 'Lead Recente',
        phone: '41999990000',
        interest: 'Apartamento 2 quartos',
        budget: '2000-3000',
        source: 'OTHER',
      },
    })

    await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: brokerId,
        name: 'Lead Antigo',
        phone: '41999990001',
        interest: 'Casa',
        budget: '1000-2000',
        source: 'REFERRAL',
        createdAt: saoPaulo(currentYear, currentMonth - 2, 10, 12),
      },
    })

    async function activateContract(propertyId: string, price: number, activatedAt: Date) {
      const opportunity = await prisma.opportunity.create({
        data: {
          tenantId,
          propertyId,
          responsibleId: await propertyResponsibleId(prisma, propertyId),
          interestedName: 'Interessado Teste',
          interestedEmail: `interessado-${randomUUID()}@example.com`,
          proposedValue: price,
          status: 'ACCEPTED',
        },
      })

      return prisma.contract.create({
        data: {
          tenantId,
          propertyId,
          sourceOpportunityId: opportunity.id,
          code: `CTR-${randomUUID()}`,
          type: 'RESIDENTIAL',
          amount: price,
          dueDay: 5,
          startDate: calendarDate(currentYear, currentMonth, 1),
          endDate: calendarDate(currentYear + 1, currentMonth, 1),
          adjustmentIndex: 'IGPM',
          guaranteeType: 'DEPOSIT',
          status: 'ACTIVE',
          activatedAt,
        },
      })
    }

    const contractWithAddress = await activateContract(
      propertyWithAddressId,
      3000,
      saoPaulo(currentYear, currentMonth, 20, 12),
    )
    await activateContract(
      propertyWithoutAddressId,
      2000,
      saoPaulo(currentYear, currentMonth, 10, 12),
    )

    await prisma.charge.create({
      data: {
        tenantId,
        contractId: contractWithAddress.id,
        code: `COB-${randomUUID()}`,
        type: 'RECEIVABLE',
        amount: 1500,
        dueDate: calendarDate(currentYear, currentMonth, 25),
        status: 'PENDING',
      },
    })

    await prisma.agendaEvent.create({
      data: {
        tenantId,
        responsibleId: brokerId,
        title: 'Visita agendada ao Apartamento Batel',
        type: 'VISIT',
        start: new Date('2026-09-28T14:00:00.000Z'),
        end: new Date('2026-09-28T15:00:00.000Z'),
        participantName: 'Cliente Interessado',
        participantPhone: '41988887777',
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

    const { year: currentYear, month: currentMonth } = calendarMonthInTimeZone(new Date())
    const currentMonthEntry = json.revenueSeries.find(
      (entry: { year: number; month: number }) =>
        entry.year === currentYear && entry.month === currentMonth + 1,
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
      data: { name: 'Outra Imobiliária', slug: `outra-imobiliaria-${randomUUID()}` },
    })

    try {
      const [otherOwner, otherBroker] = await Promise.all(
        (['OWNER', 'AGENT'] as const).map((role) =>
          prisma.user.create({
            data: {
              tenantId: otherTenant.id,
              name: `Outro ${role}`,
              email: `outro-${role.toLowerCase()}-${randomUUID()}@ketris.dev`,
              passwordHash: 'hash-fake',
              role,
            },
          }),
        ),
      )
      await prisma.property.create({
        data: {
          tenantId: otherTenant.id,
          responsibleId: otherBroker.id,
          title: 'Imóvel da Outra Imobiliária',
          purpose: 'SALE',
          type: 'HOUSE',
          price: 900000,
          status: 'SOLD',
        },
      })
      await prisma.lead.create({
        data: {
          tenantId: otherTenant.id,
          responsibleId: otherBroker.id,
          name: 'Lead da Outra Imobiliária',
          phone: '41988880000',
          interest: 'Casa',
          budget: '900000',
          source: 'OTHER',
        },
      })

      const after = await (await GET(buildRequest(ownerToken))).json()
      expect(after.kpis).toEqual(before.kpis)
      expect(after.topBrokers).toEqual(before.topBrokers)
      expect(JSON.stringify(after)).not.toContain('Outra Imobiliária')

      const otherOwnerToken = await tokenService.sign({
        id: otherOwner.id,
        tenantId: otherOwner.tenantId,
        name: otherOwner.name,
        email: otherOwner.email,
        role: otherOwner.role,
        active: otherOwner.active,
        membershipApprovedAt: otherOwner.membershipApprovedAt,
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
    const { year, month } = calendarMonthInTimeZone(new Date())
    const previousMonthStart = saoPaulo(year, month - 1, 1)
    const previousMonthDate = (day: number) => calendarDate(year, month - 1, day)

    await prisma.property.create({
      data: {
        tenantId,
        responsibleId: brokerId,
        title: 'Casa Cadastrada Há Dois Meses',
        purpose: 'SALE',
        type: 'HOUSE',
        price: 1000,
        status: 'DRAFT',
        createdAt: saoPaulo(year, month - 2, 5),
      },
    })

    await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: brokerId,
        name: 'Lead Do Mês Passado',
        phone: '41999990002',
        interest: 'Apartamento',
        budget: '1000-2000',
        source: 'OTHER',
        createdAt: previousMonthStart,
      },
    })

    for (const [price, status] of [
      [1000, 'PAID'],
      [400, 'PENDING'],
      [999, 'CANCELED'],
      [700, 'SCHEDULED'],
    ] as const) {
      await prisma.charge.create({
        data: {
          tenantId,
          code: `COB-${randomUUID()}`,
          type: 'RECEIVABLE',
          amount: price,
          dueDate: previousMonthDate(10),
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
    expect(json.kpis.monthlyReceivablePreviousMonth).toBe(2100)
  })

  describe('limites dos períodos de comparação (relógio em 13/01/2027 14:00)', () => {
    const tenantIds: string[] = []
    let frozenOwnerToken: string

    async function createTenantWithOwner(label: string) {
      const tenant = await prisma.tenant.create({
        data: { name: `Tenant ${label}`, slug: `agency-dashboard-${label}-${randomUUID()}` },
      })
      tenantIds.push(tenant.id)
      const owner = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          name: `Owner ${label}`,
          email: `owner-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role: 'OWNER',
        },
      })

      return { tenant, owner }
    }

    async function seedComparisonData(tenantId: string, ownerId: string) {
      for (const [index, createdAt] of [
        saoPaulo(2026, 11, 1, 0, 0),
        saoPaulo(2026, 11, 13, 13, 59),
        saoPaulo(2026, 11, 13, 14, 0),
        saoPaulo(2026, 11, 20),
        saoPaulo(2026, 10, 30, 23, 59),
        saoPaulo(2027, 0, 2),
        saoPaulo(2027, 0, 13, 13, 0),
      ].entries()) {
        await prisma.lead.create({
          data: {
            tenantId,
            responsibleId: ownerId,
            name: `Lead ${index}`,
            phone: '41999990000',
            interest: 'Apartamento',
            budget: '1000-2000',
            source: 'OTHER',
            createdAt,
          },
        })
      }

      for (const [index, createdAt] of [
        saoPaulo(2027, 0, 1, 0, 0),
        saoPaulo(2026, 11, 31, 23, 59, 59),
        saoPaulo(2027, 0, 10),
      ].entries()) {
        await prisma.property.create({
          data: {
            tenantId,
            responsibleId: ownerId,
            title: `Imóvel ${index}`,
            purpose: 'SALE',
            type: 'HOUSE',
            price: 1000,
            status: 'DRAFT',
            createdAt,
          },
        })
      }

      for (const [price, type, status, dueDate] of [
        [100, 'RECEIVABLE', 'PAID', calendarDate(2026, 11, 1)],
        [200, 'RECEIVABLE', 'PENDING', calendarDate(2026, 11, 31)],
        [4000, 'RECEIVABLE', 'PENDING', calendarDate(2027, 0, 1)],
        [8000, 'RECEIVABLE', 'PAID', calendarDate(2026, 10, 30)],
        [16000, 'PAYABLE', 'PAID', calendarDate(2026, 11, 15)],
        [32000, 'RECEIVABLE', 'SCHEDULED', calendarDate(2026, 11, 15)],
        [64000, 'RECEIVABLE', 'PENDING', calendarDate(2026, 11, 15)],
        [128000, 'RECEIVABLE', 'CANCELED', calendarDate(2026, 11, 15)],
      ] as const) {
        await prisma.charge.create({
          data: { tenantId, code: `COB-${randomUUID()}`, type, amount: price, dueDate, status },
        })
      }
    }

    beforeAll(async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(saoPaulo(2027, 0, 13, 14, 0))

      const { tenant, owner } = await createTenantWithOwner('frozen')
      await seedComparisonData(tenant.id, owner.id)

      // Another tenant with the same data must not leak into the counts.
      const other = await createTenantWithOwner('other')
      await seedComparisonData(other.tenant.id, other.owner.id)

      frozenOwnerToken = await tokenService.sign({
        id: owner.id,
        tenantId: owner.tenantId,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        active: owner.active,
        membershipApprovedAt: owner.membershipApprovedAt,
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

    it('soma no mês anterior as cobranças a receber não canceladas com vencimento em dezembro', async () => {
      const json = await (await GET(buildRequest(frozenOwnerToken))).json()

      expect(json.kpis.monthlyReceivable).toBe(4000)
      expect(json.kpis.monthlyReceivablePreviousMonth).toBe(96300)
    })
  })
})
