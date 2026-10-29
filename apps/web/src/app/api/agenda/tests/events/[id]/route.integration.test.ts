import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, PATCH } from '../../../events/[id]/route'

describe('/api/agenda/events/{id} (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorId: string
  let actorToken: string
  let renterToken: string
  let eventId: string
  let otherTenantEventId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Agenda Detail', slug: `agenda-detail-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { name: 'Other Agenda Detail', slug: `other-agenda-detail-${randomUUID()}` },
    })
    otherTenantId = otherTenant.id

    const actor = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor Agenda',
        email: `corretor-agenda-detail-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    actorId = actor.id
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
        email: `locatario-agenda-detail-${randomUUID()}@ketris.dev`,
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
        title: 'Follow-up com cliente',
        type: 'FOLLOW_UP',
        freeFormPropertyReference: 'Apto fora da carteira',
        start: new Date('2026-10-10T13:00:00.000Z'),
        end: new Date('2026-10-10T13:30:00.000Z'),
        participantName: 'Ana',
        participantPhone: '11999990000',
      },
    })
    eventId = event.id

    const otherTenantActor = await prisma.user.create({
      data: {
        tenantId: otherTenantId,
        name: 'Outro Corretor',
        email: `outro-agenda-detail-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    const otherTenantEvent = await prisma.agendaEvent.create({
      data: {
        tenantId: otherTenantId,
        responsibleId: otherTenantActor.id,
        createdById: otherTenantActor.id,
        title: 'Evento de outro tenant',
        freeFormPropertyReference: 'Externo',
        start: new Date('2026-10-10T13:00:00.000Z'),
        end: new Date('2026-10-10T13:30:00.000Z'),
        participantName: 'X',
        participantPhone: '0',
      },
    })
    otherTenantEventId = otherTenantEvent.id
  })

  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    if (otherTenantId) await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(
    method: string,
    id: string,
    body?: unknown,
    token = actorToken,
  ): NextRequest {
    return new NextRequest(`http://localhost/api/agenda/events/${id}`, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  it('consulta evento dentro do tenant do ator', async () => {
    const response = await GET(buildRequest('GET', eventId), context(eventId))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.event.id).toBe(eventId)
    expect(json.event.tenantId).toBe(tenantId)
    expect(json.event.responsibleId).toBe(actorId)
  })

  it('retorna 404 quando um RENTER do mesmo tenant consulta um evento sem vínculo com ele', async () => {
    const response = await GET(
      buildRequest('GET', eventId, undefined, renterToken),
      context(eventId),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('NOT_FOUND')
    expect(json.event).toBeUndefined()
  })

  it('retorna 404 para evento de outro tenant', async () => {
    const response = await GET(buildRequest('GET', otherTenantEventId), context(otherTenantEventId))
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('NOT_FOUND')
  })

  it('atualiza campos gerais sem alterar data/hora', async () => {
    const response = await PATCH(
      buildRequest('PATCH', eventId, { title: 'Follow-up atualizado', notes: 'Cliente confirmou' }),
      context(eventId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.event.title).toBe('Follow-up atualizado')
    expect(json.event.notes).toBe('Cliente confirmou')
    expect(json.event.start).toBe('2026-10-10T13:00:00.000Z')
  })

  it('retorna 400 ao marcar como VISIT um evento com menos de 30 minutos', async () => {
    const response = await PATCH(
      buildRequest('PATCH', eventId, { kind: 'VISIT', durationMinutes: 15 }),
      context(eventId),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest('GET', eventId, undefined, ''), context(eventId))

    expect(response.status).toBe(401)
  })
})
