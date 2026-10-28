import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { dayBoundsInTimeZone } from '@server/shared/time-zone-calendar'

import { GET } from '../../overview/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

type UserRole = 'OWNER' | 'AGENT' | 'RENTER' | 'PROPERTY_OWNER'

describe('/api/dashboard/overview (integração)', () => {
  const tokenService = new JoseTokenService()
  const tokens = {} as Record<'owner' | 'agentA' | 'agentB' | 'renter' | 'propertyOwner', string>
  const eventIds = {} as Record<string, string>
  let tenantId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Dashboard', slug: `dashboard-${randomUUID()}` },
    })
    tenantId = tenant.id

    async function createUser(role: UserRole) {
      const user = await prisma.user.create({
        data: {
          tenantId,
          name: `Usuário ${role}`,
          email: `dashboard-${role.toLowerCase()}-${randomUUID()}@ketris.dev`,
          passwordHash: 'hash-fake',
          role,
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

    const owner = await createUser('OWNER')
    const agentA = await createUser('AGENT')
    const agentB = await createUser('AGENT')
    tokens.owner = owner.token
    tokens.agentA = agentA.token
    tokens.agentB = agentB.token
    tokens.renter = (await createUser('RENTER')).token
    tokens.propertyOwner = (await createUser('PROPERTY_OWNER')).token

    const createProperty = (responsibleId: string) =>
      prisma.property.create({
        data: {
          tenantId,
          responsibleId,
          title: 'Apartamento Dashboard',
          purpose: 'RENT',
          type: 'APARTMENT',
          price: 2500,
          status: 'PUBLISHED',
        },
      })
    const propertyA = await createProperty(agentA.user.id)
    const propertyB = await createProperty(agentB.user.id)

    const createOpportunity = async (
      propertyId: string,
      status: 'SENT' | 'IN_NEGOTIATION' | 'ACCEPTED',
      archivedAt: Date | null = null,
    ) =>
      prisma.opportunity.create({
        data: {
          tenantId,
          propertyId,
          responsibleId: await propertyResponsibleId(prisma, propertyId),
          interestedName: 'Interessado',
          interestedEmail: `interessado-${randomUUID()}@example.com`,
          proposedValue: 2500,
          status,
          archivedAt,
        },
      })
    await createOpportunity(propertyA.id, 'SENT')
    await createOpportunity(propertyB.id, 'IN_NEGOTIATION')
    await createOpportunity(propertyA.id, 'SENT', new Date())
    const accepted = await createOpportunity(propertyA.id, 'ACCEPTED')

    const createLead = (responsibleId: string, name: string, opportunityId: string | null) =>
      prisma.lead.create({
        data: {
          tenantId,
          responsibleId,
          name,
          phone: '(11) 90000-0000',
          interest: 'Apartamento',
          budget: 'Até R$ 3.000',
          source: 'WEBSITE',
          opportunityId,
        },
      })
    await createLead(agentA.user.id, 'Lead ativo do A', null)
    await createLead(agentA.user.id, 'Lead convertido do A', accepted.id)
    await createLead(agentB.user.id, 'Lead ativo do B', null)

    const today = dayBoundsInTimeZone(new Date())
    const hour = 60 * 60_000
    const day = 24 * hour
    const createEvent = async (
      key: string,
      data: {
        responsibleId: string
        start: Date
        type?: 'VISIT' | 'MEETING'
        audience?: 'SHARED_TEAM' | 'ALL_AGENTS' | 'ASSIGNED_AGENT'
        internal?: boolean
        status?: 'CONFIRMED' | 'CANCELLED'
      },
    ) => {
      const event = await prisma.agendaEvent.create({
        data: {
          tenantId,
          title: key,
          type: data.type ?? 'VISIT',
          audience: data.audience ?? 'SHARED_TEAM',
          internal: data.internal ?? false,
          status: data.status ?? 'CONFIRMED',
          responsibleId: data.responsibleId,
          start: data.start,
          end: new Date(data.start.getTime() + 30 * 60_000),
          participantName: 'Cliente',
          participantPhone: '(11) 98888-0000',
          freeFormPropertyReference: 'Imóvel de teste',
        },
      })
      eventIds[key] = event.id
    }

    // Visitas de hoje (sempre dentro do dia e do mês, qualquer que seja a hora do teste).
    await createEvent('visita-A-hoje', { responsibleId: agentA.user.id, start: today.start })
    await createEvent('visita-B-hoje', {
      responsibleId: agentB.user.id,
      start: new Date(today.start.getTime() + 1 * hour),
      audience: 'ASSIGNED_AGENT',
    })
    await createEvent('visita-todos-hoje', {
      responsibleId: agentA.user.id,
      start: new Date(today.start.getTime() + 2 * hour),
      audience: 'ALL_AGENTS',
    })
    await createEvent('visita-interna-A-hoje', {
      responsibleId: agentA.user.id,
      start: new Date(today.start.getTime() + 3 * hour),
      internal: true,
    })
    await createEvent('visita-cancelada-A-hoje', {
      responsibleId: agentA.user.id,
      start: new Date(today.start.getTime() + 4 * hour),
      status: 'CANCELLED',
    })

    // Próximas atividades (a partir de amanhã, sem corte no fim do mês).
    await createEvent('reuniao-A-futura', {
      responsibleId: agentA.user.id,
      start: new Date(today.end.getTime() + 1 * day + 10 * hour),
      type: 'MEETING',
    })
    await createEvent('reuniao-todos-futura', {
      responsibleId: agentB.user.id,
      start: new Date(today.end.getTime() + 2 * day + 10 * hour),
      type: 'MEETING',
      audience: 'ALL_AGENTS',
    })
    await createEvent('reuniao-B-futura', {
      responsibleId: agentB.user.id,
      start: new Date(today.end.getTime() + 3 * day + 10 * hour),
      type: 'MEETING',
      audience: 'ASSIGNED_AGENT',
    })
    await createEvent('reuniao-cancelada-A-futura', {
      responsibleId: agentA.user.id,
      start: new Date(today.end.getTime() + 4 * day + 10 * hour),
      type: 'MEETING',
      status: 'CANCELLED',
    })
    await createEvent('reuniao-A-passada', {
      responsibleId: agentA.user.id,
      start: new Date(today.start.getTime() - 2 * day),
      type: 'MEETING',
    })
  })

  afterAll(async () => {
    if (tenantId) {
      await prisma.agendaEvent.deleteMany({ where: { tenantId } })
      await prisma.lead.deleteMany({ where: { tenantId } })
      await prisma.opportunity.deleteMany({ where: { tenantId } })
      await prisma.property.deleteMany({ where: { tenantId } })
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    await prisma.$disconnect()
  })

  async function getOverview(token: string) {
    const response = await GET(
      new NextRequest('http://localhost/api/dashboard/overview', {
        headers: { authorization: `Bearer ${token}` },
      }),
    )

    return { status: response.status, body: await response.json() }
  }

  const upcomingTitles = (body: { upcomingActivities: { title: string }[] }) =>
    body.upcomingActivities.map((activity) => activity.title)

  it('OWNER vê os números da imobiliária inteira', async () => {
    const { status, body } = await getOverview(tokens.owner)

    expect(status).toBe(200)
    expect(body.metrics).toEqual({
      activeLeads: 2,
      activeLeadsCreatedToday: 2,
      visitsThisMonth: 4,
      visitsToday: 4,
      openProposals: 2,
      proposalsAwaitingResponse: 1,
    })
    expect(body.recentLeads).toHaveLength(3)

    const titles = upcomingTitles(body)
    expect(titles).toEqual(expect.arrayContaining(['reuniao-A-futura', 'reuniao-todos-futura']))
    expect(titles).not.toContain('reuniao-cancelada-A-futura')
    expect(titles).not.toContain('reuniao-A-passada')
    expect(titles.length).toBeLessThanOrEqual(5)
  })

  it('AGENT vê só o próprio trabalho, com a visibilidade da agenda', async () => {
    const { status, body } = await getOverview(tokens.agentA)

    expect(status).toBe(200)
    expect(body.metrics).toEqual({
      activeLeads: 1,
      activeLeadsCreatedToday: 1,
      visitsThisMonth: 1,
      visitsToday: 1,
      openProposals: 1,
      proposalsAwaitingResponse: 1,
    })
    expect(body.recentLeads.map((lead: { name: string }) => lead.name).sort()).toEqual([
      'Lead ativo do A',
      'Lead convertido do A',
    ])

    const titles = upcomingTitles(body)
    expect(titles).toEqual(expect.arrayContaining(['reuniao-A-futura', 'reuniao-todos-futura']))
    expect(titles).not.toContain('reuniao-B-futura')
    expect(titles).not.toContain('visita-interna-A-hoje')
    expect(titles).not.toContain('reuniao-cancelada-A-futura')
  })

  it('ordena as próximas atividades pela data de início', async () => {
    const { body } = await getOverview(tokens.agentA)
    const starts = body.upcomingActivities.map((activity: { start: string }) =>
      Date.parse(activity.start),
    )

    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })

  it('outro AGENT não vê os números do colega', async () => {
    const { body } = await getOverview(tokens.agentB)

    expect(body.metrics).toMatchObject({
      activeLeads: 1,
      visitsThisMonth: 1,
      openProposals: 1,
      proposalsAwaitingResponse: 0,
    })
    expect(upcomingTitles(body)).toEqual(
      expect.arrayContaining(['reuniao-todos-futura', 'reuniao-B-futura']),
    )
    expect(upcomingTitles(body)).not.toContain('reuniao-A-futura')
  })

  it.each([
    ['RENTER', 'renter'],
    ['PROPERTY_OWNER', 'propertyOwner'],
  ] as const)('%s recebe 403', async (_role, key) => {
    const { status, body } = await getOverview(tokens[key])

    expect(status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('exige autenticação', async () => {
    const response = await GET(new NextRequest('http://localhost/api/dashboard/overview'))

    expect(response.status).toBe(401)
  })
})
