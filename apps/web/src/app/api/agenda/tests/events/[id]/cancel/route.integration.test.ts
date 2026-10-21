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
  // Creating an event needs 3h of notice, so a fixed date breaks the test once it passes.
  // January 15th of next year at 13:00 UTC (10:00 in São Paulo) stays ahead and in business hours.
  const slotStart = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 0, 15, 13, 0))

  beforeAll(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-01T09:00:00.000Z'))

    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Agenda Cancel', slug: `agenda-cancel-${randomUUID()}` },
    })
    tenantId = tenant.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor Agenda',
        email: `corretor-agenda-cancel-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      nome: actor.nome,
      email: actor.email,
      papel: actor.papel,
      ativo: actor.ativo,
      vinculoAprovadoEm: actor.vinculoAprovadoEm,
    })

    const renter = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Locatário Agenda',
        email: `locatario-agenda-cancel-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'RENTER',
      },
    })
    renterToken = await tokenService.sign({
      id: renter.id,
      tenantId: renter.tenantId,
      nome: renter.nome,
      email: renter.email,
      papel: renter.papel,
      ativo: renter.ativo,
      vinculoAprovadoEm: renter.vinculoAprovadoEm,
    })

    const event = await prisma.eventoAgenda.create({
      data: {
        tenantId,
        responsavelId: actor.id,
        criadoPorId: actor.id,
        titulo: 'Evento para cancelar',
        referenciaImovelLivre: 'Apto teste',
        inicio: slotStart,
        fim: new Date(slotStart.getTime() + 30 * 60_000),
        participanteNome: 'Ana',
        participanteTelefone: '11999990000',
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
      headers: { authorization: `Bearer ${token}` },
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  it('retorna 403 quando um RENTER tenta cancelar', async () => {
    const response = await POST(buildRequest(eventId, renterToken), context(eventId))
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('cancela o evento (soft — status vira CANCELLED)', async () => {
    const response = await POST(buildRequest(eventId), context(eventId))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.event.status).toBe('CANCELLED')

    const persisted = await prisma.eventoAgenda.findUniqueOrThrow({ where: { id: eventId } })
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
