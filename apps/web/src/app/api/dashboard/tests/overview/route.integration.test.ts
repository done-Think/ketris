import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { dayBoundsInTimeZone } from '@server/shared/time-zone-calendar'

import { GET } from '../../overview/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

type Papel = 'OWNER' | 'AGENT' | 'RENTER' | 'PROPERTY_OWNER'

describe('/api/dashboard/overview (integração)', () => {
  const tokenService = new JoseTokenService()
  const tokens = {} as Record<'owner' | 'agentA' | 'agentB' | 'renter' | 'propertyOwner', string>
  const eventIds = {} as Record<string, string>
  let tenantId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Dashboard', slug: `dashboard-${randomUUID()}` },
    })
    tenantId = tenant.id

    async function createUser(papel: Papel) {
      const user = await prisma.usuario.create({
        data: {
          tenantId,
          nome: `Usuário ${papel}`,
          email: `dashboard-${papel.toLowerCase()}-${randomUUID()}@ketris.dev`,
          senhaHash: 'hash-fake',
          papel,
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

    const owner = await createUser('OWNER')
    const agentA = await createUser('AGENT')
    const agentB = await createUser('AGENT')
    tokens.owner = owner.token
    tokens.agentA = agentA.token
    tokens.agentB = agentB.token
    tokens.renter = (await createUser('RENTER')).token
    tokens.propertyOwner = (await createUser('PROPERTY_OWNER')).token

    const createProperty = (responsavelId: string) =>
      prisma.imovel.create({
        data: {
          tenantId,
          responsavelId,
          titulo: 'Apartamento Dashboard',
          finalidade: 'ALUGUEL',
          tipo: 'APARTAMENTO',
          valor: 2500,
          status: 'PUBLISHED',
        },
      })
    const propertyA = await createProperty(agentA.user.id)
    const propertyB = await createProperty(agentB.user.id)

    const createOpportunity = async (
      imovelId: string,
      status: 'ENVIADA' | 'EM_NEGOCIACAO' | 'ACEITA',
      arquivadaEm: Date | null = null,
    ) =>
      prisma.oportunidade.create({
        data: {
          tenantId,
          imovelId,
          responsavelId: await propertyResponsibleId(prisma, imovelId),
          interessadoNome: 'Interessado',
          interessadoEmail: `interessado-${randomUUID()}@example.com`,
          valorProposto: 2500,
          status,
          arquivadaEm,
        },
      })
    await createOpportunity(propertyA.id, 'ENVIADA')
    await createOpportunity(propertyB.id, 'EM_NEGOCIACAO')
    await createOpportunity(propertyA.id, 'ENVIADA', new Date())
    const accepted = await createOpportunity(propertyA.id, 'ACEITA')

    const createLead = (responsavelId: string, nome: string, oportunidadeId: string | null) =>
      prisma.lead.create({
        data: {
          tenantId,
          responsavelId,
          nome,
          telefone: '(11) 90000-0000',
          interesse: 'Apartamento',
          orcamento: 'Até R$ 3.000',
          origem: 'SITE',
          oportunidadeId,
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
        responsavelId: string
        inicio: Date
        tipo?: 'VISIT' | 'MEETING'
        destino?: 'SHARED_TEAM' | 'ALL_AGENTS' | 'ASSIGNED_AGENT'
        interno?: boolean
        status?: 'CONFIRMED' | 'CANCELLED'
      },
    ) => {
      const event = await prisma.eventoAgenda.create({
        data: {
          tenantId,
          titulo: key,
          tipo: data.tipo ?? 'VISIT',
          destino: data.destino ?? 'SHARED_TEAM',
          interno: data.interno ?? false,
          status: data.status ?? 'CONFIRMED',
          responsavelId: data.responsavelId,
          inicio: data.inicio,
          fim: new Date(data.inicio.getTime() + 30 * 60_000),
          participanteNome: 'Cliente',
          participanteTelefone: '(11) 98888-0000',
          referenciaImovelLivre: 'Imóvel de teste',
        },
      })
      eventIds[key] = event.id
    }

    // Visitas de hoje (sempre dentro do dia e do mês, qualquer que seja a hora do teste).
    await createEvent('visita-A-hoje', { responsavelId: agentA.user.id, inicio: today.start })
    await createEvent('visita-B-hoje', {
      responsavelId: agentB.user.id,
      inicio: new Date(today.start.getTime() + 1 * hour),
      destino: 'ASSIGNED_AGENT',
    })
    await createEvent('visita-todos-hoje', {
      responsavelId: agentA.user.id,
      inicio: new Date(today.start.getTime() + 2 * hour),
      destino: 'ALL_AGENTS',
    })
    await createEvent('visita-interna-A-hoje', {
      responsavelId: agentA.user.id,
      inicio: new Date(today.start.getTime() + 3 * hour),
      interno: true,
    })
    await createEvent('visita-cancelada-A-hoje', {
      responsavelId: agentA.user.id,
      inicio: new Date(today.start.getTime() + 4 * hour),
      status: 'CANCELLED',
    })

    // Próximas atividades (a partir de amanhã, sem corte no fim do mês).
    await createEvent('reuniao-A-futura', {
      responsavelId: agentA.user.id,
      inicio: new Date(today.end.getTime() + 1 * day + 10 * hour),
      tipo: 'MEETING',
    })
    await createEvent('reuniao-todos-futura', {
      responsavelId: agentB.user.id,
      inicio: new Date(today.end.getTime() + 2 * day + 10 * hour),
      tipo: 'MEETING',
      destino: 'ALL_AGENTS',
    })
    await createEvent('reuniao-B-futura', {
      responsavelId: agentB.user.id,
      inicio: new Date(today.end.getTime() + 3 * day + 10 * hour),
      tipo: 'MEETING',
      destino: 'ASSIGNED_AGENT',
    })
    await createEvent('reuniao-cancelada-A-futura', {
      responsavelId: agentA.user.id,
      inicio: new Date(today.end.getTime() + 4 * day + 10 * hour),
      tipo: 'MEETING',
      status: 'CANCELLED',
    })
    await createEvent('reuniao-A-passada', {
      responsavelId: agentA.user.id,
      inicio: new Date(today.start.getTime() - 2 * day),
      tipo: 'MEETING',
    })
  })

  afterAll(async () => {
    if (tenantId) {
      await prisma.eventoAgenda.deleteMany({ where: { tenantId } })
      await prisma.lead.deleteMany({ where: { tenantId } })
      await prisma.oportunidade.deleteMany({ where: { tenantId } })
      await prisma.imovel.deleteMany({ where: { tenantId } })
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
  ] as const)('%s recebe 403', async (_papel, key) => {
    const { status, body } = await getOverview(tokens[key])

    expect(status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('exige autenticação', async () => {
    const response = await GET(new NextRequest('http://localhost/api/dashboard/overview'))

    expect(response.status).toBe(401)
  })
})
