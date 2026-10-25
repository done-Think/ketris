import { randomUUID } from 'node:crypto'
import type { Usuario } from '@prisma/client'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { GET as LIST, POST as CREATE } from '../../events/route'
import { GET as GET_ONE, PATCH } from '../../events/[id]/route'
import { POST as CANCEL } from '../../events/[id]/cancel/route'
import { POST as RESCHEDULE } from '../../events/[id]/reschedule/route'

describe('Agency team event visibility and mutations', () => {
  const tokenService = new JoseTokenService()
  const suffix = randomUUID()
  const tenants: string[] = []
  let agency: string
  let propertyId: string
  let admin: Usuario
  let agent: Usuario
  let colleague: Usuario
  let foreignAgent: Usuario
  let collective: string
  let assigned: string
  let legacy: string
  let foreign: string
  const tokens: Record<string, string> = {}

  function request(method: string, path: string, token: string, body?: unknown) {
    if (path.endsWith('/cancel') && body === undefined) body = { reason: 'Cliente indisponível' }
    return new NextRequest(`http://localhost/api/agenda/events${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  }
  const context = (id: string) => ({ params: Promise.resolve({ id }) })
  async function list(token: string) {
    const response = await LIST(
      request('GET', '?from=2031-03-01T00:00:00Z&to=2031-03-10T00:00:00Z', token),
    )
    expect(response.status).toBe(200)
    return (await response.json()).events.map((event: { id: string }) => event.id) as string[]
  }
  function createEvent(
    tenantId: string,
    responsibleId: string,
    title: string,
    audience: 'SHARED_TEAM' | 'ALL_AGENTS' | 'ASSIGNED_AGENT',
    internal = true,
  ) {
    return prisma.eventoAgenda.create({
      data: {
        tenantId,
        responsavelId: responsibleId,
        criadoPorId: responsibleId,
        titulo: title,
        destino: audience,
        interno: internal,
        inicio: new Date('2031-03-03T13:00:00Z'),
        fim: new Date('2031-03-03T14:00:00Z'),
        participanteNome: internal ? '' : 'Client',
        participanteTelefone: internal ? '' : '(11) 99999-0000',
      },
    })
  }

  async function createBooking(
    start: string,
    responsibleId: string,
    durationMinutes = 60,
    extra: Record<string, unknown> = {},
  ) {
    const response = await CREATE(
      request('POST', '', tokens.admin, {
        title: 'Visit booking',
        kind: 'VISIT',
        audience: 'ASSIGNED_AGENT',
        responsibleId,
        propertyId,
        start,
        durationMinutes,
        participantName: 'Client',
        participantPhone: '(11) 99999-0000',
        ...extra,
      }),
    )
    return { status: response.status, body: await response.json() }
  }

  beforeAll(async () => {
    for (const name of ['agency', 'other']) {
      tenants.push(
        (await prisma.tenant.create({ data: { nome: name, slug: `${name}-team-${suffix}` } })).id,
      )
    }
    agency = tenants[0]
    const users: Record<string, Usuario> = {}
    for (const [name, role, tenantId] of [
      ['admin', 'OWNER', agency],
      ['agent', 'AGENT', agency],
      ['colleague', 'AGENT', agency],
      ['owner', 'PROPERTY_OWNER', agency],
      ['renter', 'RENTER', agency],
      ['foreign', 'AGENT', tenants[1]],
    ] as const) {
      const user = await prisma.usuario.create({
        data: {
          tenantId,
          nome: name,
          email: `${name}-team-${suffix}@example.test`,
          senhaHash: 'test',
          papel: role,
          vinculoAprovadoEm: new Date(),
        },
      })
      users[name] = user
      tokens[name] = await tokenService.sign({
        id: user.id,
        tenantId: user.tenantId,
        nome: user.nome,
        email: user.email,
        papel: user.papel,
        ativo: user.ativo,
        vinculoAprovadoEm: user.vinculoAprovadoEm,
      })
    }
    admin = users.admin
    agent = users.agent
    colleague = users.colleague
    foreignAgent = users.foreign
    propertyId = (
      await prisma.imovel.create({
        data: {
          tenantId: agency,
          responsavelId: agent.id,
          titulo: 'Visit property',
          finalidade: 'ALUGUEL',
          tipo: 'APARTAMENTO',
          valor: 1000,
          status: 'DRAFT',
        },
      })
    ).id
    collective = (await createEvent(agency, admin.id, 'Collective', 'ALL_AGENTS')).id
    assigned = (await createEvent(agency, agent.id, 'Directed', 'ASSIGNED_AGENT')).id
    legacy = (await createEvent(agency, colleague.id, 'Previous event', 'SHARED_TEAM', false)).id
    foreign = (await createEvent(tenants[1], foreignAgent.id, 'Other agency', 'ALL_AGENTS')).id
    // Even a pre-existing explicit link must not expose a newly internal event.
    await prisma.eventoAgendaParticipante.createMany({
      data: [
        { eventoId: collective, usuarioId: users.owner.id },
        { eventoId: collective, usuarioId: users.renter.id },
      ],
    })
  })

  afterAll(async () => {
    for (const id of tenants) await prisma.tenant.delete({ where: { id } })
    await prisma.$disconnect()
  })

  it('shows all its events to the agency and none from another tenant', async () => {
    expect(await list(tokens.admin)).toEqual(expect.arrayContaining([collective, assigned, legacy]))
    expect(await list(tokens.admin)).not.toContain(foreign)
  })

  it('shows collective and directed events to the selected agent', async () => {
    expect(await list(tokens.agent)).toEqual(expect.arrayContaining([collective, assigned, legacy]))
    expect(await list(tokens.agent)).not.toContain(foreign)
  })

  it('hides directed events from other agents and returns 404 for their IDs', async () => {
    const ids = await list(tokens.colleague)
    expect(ids).toEqual(expect.arrayContaining([collective, legacy]))
    expect(ids).not.toContain(assigned)
    expect(
      (await GET_ONE(request('GET', `/${assigned}`, tokens.colleague), context(assigned))).status,
    ).toBe(404)
  })

  it.each(['owner', 'renter'])(
    'hides internal events from %s despite explicit links',
    async (role) => {
      expect(await list(tokens[role])).not.toContain(collective)
      expect(
        (await GET_ONE(request('GET', `/${collective}`, tokens[role]), context(collective))).status,
      ).toBe(404)
    },
  )

  it('includes agents added after the collective event', async () => {
    const user = await prisma.usuario.create({
      data: {
        tenantId: agency,
        nome: 'New agent',
        email: `new-team-${suffix}@example.test`,
        senhaHash: 'test',
        papel: 'AGENT',
        vinculoAprovadoEm: new Date(),
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
    expect(await list(token)).toContain(collective)
    expect(await list(token)).not.toContain(assigned)
  })

  it('creates an internal event without client, phone or property through the API', async () => {
    const response = await CREATE(
      request('POST', '', tokens.admin, {
        title: 'Planning',
        internal: true,
        audience: 'ALL_AGENTS',
        start: '2031-03-04T13:00:00Z',
        durationMinutes: 60,
      }),
    )
    expect(response.status).toBe(201)
    expect((await response.json()).event).toMatchObject({
      internal: true,
      audience: 'ALL_AGENTS',
      participantName: '',
      participantPhone: '',
      propertyId: null,
    })
  })

  it('rejects a responsible agent from another tenant', async () => {
    const response = await CREATE(
      request('POST', '', tokens.admin, {
        title: 'Invalid recipient',
        internal: true,
        audience: 'ASSIGNED_AGENT',
        responsibleId: foreignAgent.id,
        start: '2031-03-05T13:00:00Z',
        durationMinutes: 60,
      }),
    )
    expect(response.status).toBe(404)
    expect(
      await prisma.eventoAgenda.count({ where: { tenantId: agency, titulo: 'Invalid recipient' } }),
    ).toBe(0)
  })

  it('blocks every mutation of an internal event by its selected agent', async () => {
    expect(
      (
        await PATCH(
          request('PATCH', `/${assigned}`, tokens.agent, { title: 'Changed' }),
          context(assigned),
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await RESCHEDULE(
          request('POST', `/${assigned}/reschedule`, tokens.agent, {
            start: '2031-03-06T13:00:00Z',
          }),
          context(assigned),
        )
      ).status,
    ).toBe(403)
    expect(
      (await CANCEL(request('POST', `/${assigned}/cancel`, tokens.agent), context(assigned)))
        .status,
    ).toBe(403)
    expect(await prisma.eventoAgenda.findUnique({ where: { id: assigned } })).toMatchObject({
      titulo: 'Directed',
      status: 'CONFIRMED',
    })
  })

  it('saves a new recipient and time in one patch and moves the event between agent agendas', async () => {
    const event = await createEvent(agency, admin.id, 'Reassignment', 'ALL_AGENTS')
    const response = await PATCH(
      request('PATCH', `/${event.id}`, tokens.admin, {
        audience: 'ASSIGNED_AGENT',
        responsibleId: colleague.id,
        start: '2031-03-07T13:00:00Z',
        durationMinutes: 45,
      }),
      context(event.id),
    )
    expect(response.status).toBe(200)
    expect((await response.json()).event).toMatchObject({
      audience: 'ASSIGNED_AGENT',
      responsibleId: colleague.id,
      start: '2031-03-07T13:00:00.000Z',
      end: '2031-03-07T13:45:00.000Z',
    })
    expect(await list(tokens.admin)).toContain(event.id)
    expect(await list(tokens.colleague)).toContain(event.id)
    expect(await list(tokens.agent)).not.toContain(event.id)
  })

  it('blocks another agent until the property visit ends and allows touching endpoints', async () => {
    expect((await createBooking('2031-03-11T13:00:00Z', agent.id)).status).toBe(201)
    expect((await createBooking('2031-03-11T13:30:00Z', colleague.id)).status).toBe(409)
    expect((await createBooking('2031-03-11T14:00:00Z', colleague.id)).status).toBe(201)
  })

  it('accepts consecutive 30 minute visits and rejects a shorter visit', async () => {
    expect((await createBooking('2031-03-12T13:00:00Z', agent.id, 30)).status).toBe(201)
    expect((await createBooking('2031-03-12T13:30:00Z', colleague.id, 30)).status).toBe(201)
    expect((await createBooking('2031-03-12T15:00:00Z', agent.id, 15)).status).toBe(400)
  })

  it('does not apply the shared property restriction to other event kinds', async () => {
    expect((await createBooking('2031-03-13T13:00:00Z', agent.id)).status).toBe(201)
    expect(
      (await createBooking('2031-03-13T13:00:00Z', colleague.id, 15, { kind: 'MEETING' })).status,
    ).toBe(201)
  })

  it('checks property conflicts when changing an event kind to VISIT', async () => {
    await createBooking('2031-03-14T13:00:00Z', agent.id)
    const meeting = await createBooking('2031-03-14T13:00:00Z', colleague.id, 60, {
      kind: 'MEETING',
    })
    expect(meeting.status).toBe(201)
    const id = meeting.body.event.id
    const response = await PATCH(
      request('PATCH', `/${id}`, tokens.admin, { kind: 'VISIT' }),
      context(id),
    )
    expect(response.status).toBe(409)
    expect(await prisma.eventoAgenda.findUnique({ where: { id } })).toMatchObject({
      tipo: 'MEETING',
    })
  })

  it('checks property conflicts while rescheduling and preserves the previous time on failure', async () => {
    await createBooking('2031-03-15T13:00:00Z', agent.id)
    const later = await createBooking('2031-03-15T16:00:00Z', colleague.id)
    expect(later.status).toBe(201)
    const id = later.body.event.id
    const response = await RESCHEDULE(
      request('POST', `/${id}/reschedule`, tokens.admin, { start: '2031-03-15T13:30:00Z' }),
      context(id),
    )
    expect(response.status).toBe(409)
    expect(await prisma.eventoAgenda.findUnique({ where: { id } })).toMatchObject({
      inicio: new Date('2031-03-15T16:00:00Z'),
    })
  })

  it('releases the property after cancelling the previous visit', async () => {
    const visit = await createBooking('2031-03-16T13:00:00Z', agent.id)
    expect(visit.status).toBe(201)
    const id = visit.body.event.id
    expect((await CANCEL(request('POST', `/${id}/cancel`, tokens.admin), context(id))).status).toBe(
      200,
    )
    expect((await createBooking('2031-03-16T13:00:00Z', colleague.id)).status).toBe(201)
  })

  it('serializes simultaneous property reservations by different agents', async () => {
    const results = await Promise.all([
      createBooking('2031-03-17T13:00:00Z', agent.id),
      createBooking('2031-03-17T13:00:00Z', colleague.id),
    ])
    expect(results.map((result) => result.status).sort()).toEqual([201, 409])
    expect(
      await prisma.eventoAgenda.count({
        where: { tenantId: agency, imovelId: propertyId, inicio: new Date('2031-03-17T13:00:00Z') },
      }),
    ).toBe(1)
  })

  it('requires explicit outside-hours confirmation before creating or changing a period', async () => {
    expect((await createBooking('2031-03-18T20:30:00Z', agent.id)).status).toBe(409)
    const accepted = await createBooking('2031-03-18T20:30:00Z', agent.id, 60, {
      outsideBusinessHoursConfirmed: true,
    })
    expect(accepted.status).toBe(201)
    const id = accepted.body.event.id
    const change = { start: '2031-03-18T23:00:00Z', durationMinutes: 30 }
    expect(
      (await PATCH(request('PATCH', `/${id}`, tokens.admin, change), context(id))).status,
    ).toBe(409)
    expect(
      (
        await PATCH(
          request('PATCH', `/${id}`, tokens.admin, {
            ...change,
            outsideBusinessHoursConfirmed: true,
          }),
          context(id),
        )
      ).status,
    ).toBe(200)
  })

  it('reserves a visit across midnight until the full booked duration ends', async () => {
    expect(
      (
        await createBooking('2031-03-20T02:30:00Z', agent.id, 90, {
          outsideBusinessHoursConfirmed: true,
        })
      ).status,
    ).toBe(201)
    expect(
      (
        await createBooking('2031-03-20T03:00:00Z', colleague.id, 30, {
          outsideBusinessHoursConfirmed: true,
        })
      ).status,
    ).toBe(409)
    expect(
      (
        await createBooking('2031-03-20T04:00:00Z', colleague.id, 30, {
          outsideBusinessHoursConfirmed: true,
        })
      ).status,
    ).toBe(201)
  })
})
