import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST } from '../../../../events/[id]/cancel/route'

describe('/api/agenda/events/{id}/cancel (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let actorToken: string
  let renterToken: string
  let eventId: string
  // The clock is frozen in October 2026 below; this Friday is in the future and in business hours.
  const slotStart = new Date('2027-01-15T13:00:00.000Z')

  beforeAll(async () => {
    // Relógio fixo: criar evento exige antecedência mínima, e as datas abaixo são fixas.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-01T09:00:00.000Z'))

    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Agenda Cancel', slug: `agenda-cancel-${randomUUID()}` },
    })
    tenantId = tenant.id

    const actor = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor Agenda',
        email: `corretor-agenda-cancel-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
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

    const renter = await prisma.user.create({
      data: {
        tenantId,
        name: 'Locatário Agenda',
        email: `locatario-agenda-cancel-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'RENTER',
      },
    })
    renterToken = await tokenService.sign({
      id: renter.id,
      tenantId: renter.tenantId,
      name: renter.name,
      email: renter.email,
      role: renter.role,
      active: renter.active,
      membershipApprovedAt: renter.membershipApprovedAt,
    })

    const event = await prisma.agendaEvent.create({
      data: {
        tenantId,
        responsibleId: actor.id,
        createdById: actor.id,
        title: 'Evento para cancelar',
        freeFormPropertyReference: 'Apto teste',
        start: slotStart,
        end: new Date(slotStart.getTime() + 30 * 60_000),
        participantName: 'Ana',
        participantPhone: '11999990000',
      },
    })
    eventId = event.id
  })

  afterAll(async () => {
    vi.useRealTimers()
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(id: string, token = actorToken): NextRequest {
    return new NextRequest(`http://localhost/api/agenda/events/${id}/cancel`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'Cliente indisponível' }),
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  it('retorna 404 quando um RENTER tenta cancelar evento ao qual não está vinculado', async () => {
    const response = await POST(buildRequest(eventId, renterToken), context(eventId))

    expect(response.status).toBe(404)
  })

  it('cancela o evento (soft — status vira CANCELLED)', async () => {
    const response = await POST(buildRequest(eventId), context(eventId))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.event.status).toBe('CANCELLED')

    const persisted = await prisma.agendaEvent.findUniqueOrThrow({ where: { id: eventId } })
    expect(persisted.status).toBe('CANCELLED')
  })

  it('retorna 404 para evento inexistente', async () => {
    const response = await POST(buildRequest('inexistente'), context('inexistente'))

    expect(response.status).toBe(404)
  })

  it('um evento cancelado libera o horário para um novo agendamento (sem falso conflito)', async () => {
    const { POST: createEvent } = await import('../../../../events/route')

    const cancelResponse = await POST(buildRequest(eventId), context(eventId))
    expect(cancelResponse.status).toBe(200)

    const createRequest = new NextRequest('http://localhost/api/agenda/events', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Novo evento no horário liberado',
        propertyReference: 'Apto teste',
        start: slotStart.toISOString(),
        durationMinutes: 30,
        participantName: 'Novo cliente',
        participantPhone: '11988880000',
      }),
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${actorToken}` },
    })

    const response = await createEvent(createRequest)

    expect(response.status).toBe(201)
  })
})
