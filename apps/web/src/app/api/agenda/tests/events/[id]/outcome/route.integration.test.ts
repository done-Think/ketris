import { randomUUID } from 'node:crypto'

import type { Prisma } from '@prisma/client'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { PATCH } from '../../../../events/[id]/route'
import { POST } from '../../../../events/[id]/outcome/route'

describe('/api/agenda/events/{id}/outcome (integração)', () => {
  const tokenService = new JoseTokenService()
  const now = new Date('2026-10-01T15:00:00.000Z')
  const pastStart = new Date('2026-10-01T13:00:00.000Z')
  const futureStart = new Date('2026-10-02T13:00:00.000Z')
  const tenantIds: string[] = []
  let tenantId: string
  let ownerToken: string
  let agentId: string
  let agentToken: string
  let otherAgentToken: string
  let renterToken: string
  let otherTenantOwnerToken: string

  async function createUser(
    userTenantId: string,
    role: 'OWNER' | 'AGENT' | 'RENTER',
    name: string,
  ) {
    const user = await prisma.user.create({
      data: {
        tenantId: userTenantId,
        name,
        email: `agenda-outcome-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role,
        membershipApprovedAt: role === 'RENTER' ? null : now,
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
    return { id: user.id, token }
  }

  async function createTenant(name: string) {
    const tenant = await prisma.tenant.create({
      data: { name, slug: `agenda-outcome-${randomUUID()}` },
    })
    tenantIds.push(tenant.id)
    return tenant.id
  }

  async function createEvent(overrides: Partial<Prisma.AgendaEventUncheckedCreateInput> = {}) {
    const start = overrides.start ? new Date(overrides.start) : pastStart
    const event = await prisma.agendaEvent.create({
      data: {
        tenantId,
        responsibleId: agentId,
        createdById: agentId,
        title: 'Visita da Sabrina',
        type: 'VISIT',
        audience: 'ASSIGNED_AGENT',
        freeFormPropertyReference: 'Studio de teste',
        start,
        end: new Date(start.getTime() + 60 * 60_000),
        participantName: 'Sabrina',
        participantPhone: '12314123455',
        ...overrides,
      },
    })
    return event.id
  }

  function record(id: string, token: string, body: Record<string, unknown>) {
    return POST(
      new NextRequest(`http://localhost/api/agenda/events/${id}/outcome`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) },
    )
  }

  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)

    tenantId = await createTenant('Imobiliária Resultado')
    ownerToken = (await createUser(tenantId, 'OWNER', 'Gestor Resultado')).token
    const agent = await createUser(tenantId, 'AGENT', 'Corretor André')
    agentId = agent.id
    agentToken = agent.token
    otherAgentToken = (await createUser(tenantId, 'AGENT', 'Outro corretor')).token
    renterToken = (await createUser(tenantId, 'RENTER', 'Locatário')).token
    const otherTenantId = await createTenant('Outra imobiliária')
    otherTenantOwnerToken = (await createUser(otherTenantId, 'OWNER', 'Outro gestor')).token
  })

  afterAll(async () => {
    vi.useRealTimers()
    for (const id of tenantIds) await prisma.tenant.delete({ where: { id } })
    await prisma.$disconnect()
  })

  it('o corretor responsável registra a visita realizada com interesse, autor e histórico', async () => {
    const eventId = await createEvent()

    const response = await record(eventId, agentToken, {
      outcome: 'COMPLETED',
      visitInterest: 'MEDIUM',
      notes: 'Gostou da cozinha.',
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.event).toMatchObject({
      status: 'COMPLETED',
      visitInterest: 'MEDIUM',
      outcomeNotes: 'Gostou da cozinha.',
      outcomeRecordedById: agentId,
      outcomeRecordedBy: { name: 'Corretor André' },
      outcomeRecordedAt: now.toISOString(),
    })
    const audit = await prisma.agendaEventAudit.findFirstOrThrow({
      where: { tenantId, eventId, action: 'COMPLETED' },
    })
    expect(audit.actorUserId).toBe(agentId)
  })

  it('depois do resultado, o corretor não registra de novo e ninguém edita o evento', async () => {
    const eventId = await createEvent()
    await record(eventId, agentToken, { outcome: 'NO_SHOW' })

    const again = await record(eventId, agentToken, { outcome: 'COMPLETED', visitInterest: 'HIGH' })
    const edit = await PATCH(
      new NextRequest(`http://localhost/api/agenda/events/${eventId}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${ownerToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Outro título' }),
      }),
      { params: Promise.resolve({ id: eventId }) },
    )

    expect(again.status).toBe(409)
    expect((await again.json()).error.code).toBe('AGENDA_EVENT_CLOSED')
    expect(edit.status).toBe(409)
    expect((await edit.json()).error.code).toBe('AGENDA_EVENT_CLOSED')
  })

  it('o gestor corrige o resultado e o interesse anterior é limpo', async () => {
    const eventId = await createEvent()
    await record(eventId, agentToken, { outcome: 'COMPLETED', visitInterest: 'HIGH' })

    const response = await record(eventId, ownerToken, { outcome: 'NO_SHOW' })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.event).toMatchObject({
      status: 'NO_SHOW',
      visitInterest: null,
      outcomeRecordedBy: { name: 'Gestor Resultado' },
    })
  })

  it('exige o interesse do cliente em visita realizada', async () => {
    const eventId = await createEvent()

    const response = await record(eventId, agentToken, { outcome: 'COMPLETED' })

    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('AGENDA_VISIT_INTEREST_REQUIRED')
  })

  it('valida o corpo com Zod antes de buscar o evento', async () => {
    const eventId = await createEvent()

    const response = await record(eventId, agentToken, { outcome: 'NO_SHOW', visitInterest: 'LOW' })

    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it('recusa evento que ainda não começou', async () => {
    const eventId = await createEvent({ start: futureStart })

    const response = await record(eventId, agentToken, {
      outcome: 'COMPLETED',
      visitInterest: 'LOW',
    })

    expect(response.status).toBe(409)
    expect((await response.json()).error.code).toBe('AGENDA_OUTCOME_BEFORE_START')
  })

  it('recusa evento cancelado', async () => {
    const eventId = await createEvent({ status: 'CANCELLED', cancellationReason: 'Desistiu' })

    const response = await record(eventId, ownerToken, {
      outcome: 'COMPLETED',
      visitInterest: 'LOW',
    })

    expect(response.status).toBe(409)
    expect((await response.json()).error.code).toBe('AGENDA_OUTCOME_CANCELLED_EVENT')
  })

  it('outro corretor não registra o resultado de visita direcionada ao colega', async () => {
    const eventId = await createEvent()

    const response = await record(eventId, otherAgentToken, { outcome: 'NO_SHOW' })

    expect(response.status).toBe(403)
  })

  it('o gestor de outra imobiliária recebe o mesmo 404 de evento inexistente', async () => {
    const eventId = await createEvent()

    const response = await record(eventId, otherTenantOwnerToken, { outcome: 'NO_SHOW' })

    expect(response.status).toBe(404)
    expect((await response.json()).error.code).toBe('NOT_FOUND')
    expect((await prisma.agendaEvent.findUniqueOrThrow({ where: { id: eventId } })).status).toBe(
      'CONFIRMED',
    )
  })

  it('o locatário sem vínculo com o evento recebe 404', async () => {
    const eventId = await createEvent()

    const response = await record(eventId, renterToken, { outcome: 'NO_SHOW' })

    expect(response.status).toBe(404)
  })

  it('exige autenticação', async () => {
    const eventId = await createEvent()

    const response = await POST(
      new NextRequest(`http://localhost/api/agenda/events/${eventId}/outcome`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ outcome: 'NO_SHOW' }),
      }),
      { params: Promise.resolve({ id: eventId }) },
    )

    expect(response.status).toBe(401)
  })
})
