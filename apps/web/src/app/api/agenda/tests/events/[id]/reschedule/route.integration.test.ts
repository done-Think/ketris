import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { POST } from '../../../../events/[id]/reschedule/route'

describe('/api/agenda/events/{id}/reschedule (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let actorId: string
  let actorToken: string
  let eventId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Agenda Reschedule', slug: `agenda-reschedule-${randomUUID()}` },
    })
    tenantId = tenant.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor Agenda',
        email: `corretor-agenda-reschedule-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      nome: actor.nome,
      email: actor.email,
      papel: actor.papel,
      ativo: actor.ativo,
      vinculoAprovadoEm: actor.vinculoAprovadoEm,
    })

    const event = await prisma.eventoAgenda.create({
      data: {
        tenantId,
        responsavelId: actorId,
        criadoPorId: actorId,
        titulo: 'Visita para reagendar',
        tipo: 'VISIT',
        referenciaImovelLivre: 'Apto teste',
        status: 'PENDING',
        inicio: new Date('2026-10-12T13:00:00.000Z'),
        fim: new Date('2026-10-12T14:00:00.000Z'),
        participanteNome: 'Ana',
        participanteTelefone: '11999990000',
      },
    })
    eventId = event.id

    await prisma.eventoAgenda.create({
      data: {
        tenantId,
        responsavelId: actorId,
        criadoPorId: actorId,
        titulo: 'Outro evento do mesmo responsável',
        referenciaImovelLivre: 'Apto teste 2',
        inicio: new Date('2026-10-13T09:00:00.000Z'),
        fim: new Date('2026-10-13T09:30:00.000Z'),
        participanteNome: 'Bruno',
        participanteTelefone: '11988880000',
      },
    })
  })

  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(id: string, body: unknown, token = actorToken): NextRequest {
    return new NextRequest(`http://localhost/api/agenda/events/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  it('reagenda o evento e marca como CONFIRMED', async () => {
    const response = await POST(
      buildRequest(eventId, { start: '2026-10-14T10:00:00.000Z' }),
      context(eventId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.event.status).toBe('CONFIRMED')
    expect(json.event.start).toBe('2026-10-14T10:00:00.000Z')
    expect(json.event.end).toBe('2026-10-14T11:00:00.000Z')
  })

  it('retorna 400 ao tentar reagendar a visita para menos de 60 minutos', async () => {
    const response = await POST(
      buildRequest(eventId, { start: '2026-10-15T10:00:00.000Z', durationMinutes: 30 }),
      context(eventId),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 409 ao reagendar para um horário que colide com outro evento do mesmo responsável', async () => {
    const response = await POST(
      buildRequest(eventId, { start: '2026-10-13T09:15:00.000Z', durationMinutes: 60 }),
      context(eventId),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('CONFLICT')
  })

  it('retorna 404 para evento inexistente', async () => {
    const response = await POST(
      buildRequest('inexistente', { start: '2026-10-16T10:00:00.000Z' }),
      context('inexistente'),
    )

    expect(response.status).toBe(404)
  })

  it('não considera o próprio evento como conflito ao reagendar para o mesmo período', async () => {
    const response = await POST(
      buildRequest(eventId, { start: '2026-10-14T10:00:00.000Z', durationMinutes: 60 }),
      context(eventId),
    )

    expect(response.status).toBe(200)
  })
})
