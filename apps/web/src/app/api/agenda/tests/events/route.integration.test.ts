import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET, POST } from '../../events/route'

describe('/api/agenda/events (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorId: string
  let actorToken: string
  let renterToken: string
  let propertyId: string
  let otherTenantPropertyId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Agenda', slug: `agenda-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { name: 'Other Agenda', slug: `other-agenda-${randomUUID()}` },
    })
    otherTenantId = otherTenant.id

    const actor = await prisma.user.create({
      data: {
        tenantId,
        name: 'Corretor Agenda',
        email: `corretor-agenda-${randomUUID()}@ketris.dev`,
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
        email: `locatario-agenda-${randomUUID()}@ketris.dev`,
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

    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: actor.id,
        title: 'Imóvel da agenda',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 2500,
        status: 'DRAFT',
      },
    })
    propertyId = property.id

    const otherTenantActor = await prisma.user.create({
      data: {
        tenantId: otherTenantId,
        name: 'Outro Corretor',
        email: `outro-agenda-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'AGENT',
      },
    })
    const otherProperty = await prisma.property.create({
      data: {
        tenantId: otherTenantId,
        responsibleId: otherTenantActor.id,
        title: 'Imóvel de outro tenant',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1800,
        status: 'DRAFT',
      },
    })
    otherTenantPropertyId = otherProperty.id
  })

  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    if (otherTenantId) await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(
    method: string,
    url: string,
    body?: unknown,
    token = actorToken,
  ): NextRequest {
    return new NextRequest(url, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('cria evento atribuído ao próprio ator, vinculado a um imóvel do tenant', async () => {
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/agenda/events', {
        title: 'Visita ao apartamento',
        kind: 'VISIT',
        propertyId,
        start: '2030-01-15T16:00:00.000Z',
        durationMinutes: 60,
        participantName: 'Ana Nóbrega',
        participantPhone: '(11) 99842-2109',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.event.tenantId).toBe(tenantId)
    expect(json.event.responsibleId).toBe(actorId)
    expect(json.event.createdById).toBe(actorId)
    expect(json.event.propertyId).toBe(propertyId)
    expect(json.event.status).toBe('CONFIRMED')
    expect(json.event.start).toBe('2030-01-15T16:00:00.000Z')
    expect(json.event.end).toBe('2030-01-15T17:00:00.000Z')
  })

  it('cria evento com referência livre de imóvel, sem propertyId', async () => {
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/agenda/events', {
        title: 'Reunião externa',
        propertyReference: 'Escritório do cliente',
        start: '2030-01-16T16:00:00.000Z',
        durationMinutes: 30,
        participantName: 'Marcos Lima',
        participantPhone: '(11) 98731-4402',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.event.propertyId).toBeNull()
    expect(json.event.propertyReference).toBe('Escritório do cliente')
  })

  it('retorna 400 quando nem propertyId nem propertyReference são informados', async () => {
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/agenda/events', {
        title: 'Evento sem imóvel',
        start: '2030-01-16T16:00:00.000Z',
        durationMinutes: 30,
        participantName: 'Marcos Lima',
        participantPhone: '(11) 98731-4402',
      }),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 404 quando propertyId pertence a outro tenant', async () => {
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/agenda/events', {
        title: 'Tentativa cross-tenant',
        propertyId: otherTenantPropertyId,
        start: '2030-01-16T16:00:00.000Z',
        durationMinutes: 30,
        participantName: 'Marcos Lima',
        participantPhone: '(11) 98731-4402',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('NOT_FOUND')
  })

  it('retorna 400 quando uma visita (kind VISIT) tem duração menor que 30 minutos', async () => {
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/agenda/events', {
        title: 'Visita rápida demais',
        kind: 'VISIT',
        propertyId,
        start: '2030-01-16T18:00:00.000Z',
        durationMinutes: 15,
        participantName: 'Marcos Lima',
        participantPhone: '(11) 98731-4402',
      }),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 409 quando o responsável já tem um evento nesse horário', async () => {
    const conflictingStart = '2030-01-15T16:30:00.000Z'

    const response = await POST(
      buildRequest('POST', 'http://localhost/api/agenda/events', {
        title: 'Colide com a visita já criada',
        propertyId,
        start: conflictingStart,
        durationMinutes: 30,
        participantName: 'Outro Cliente',
        participantPhone: '(11) 90000-0000',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('CONFLICT')
  })

  it('retorna 404 quando um RENTER tenta agendar em imóvel que não aluga', async () => {
    const response = await POST(
      buildRequest(
        'POST',
        'http://localhost/api/agenda/events',
        {
          title: 'Tentativa de locatário',
          propertyId,
          start: '2030-01-16T16:00:00.000Z',
          durationMinutes: 30,
          participantName: 'Locatário X',
          participantPhone: '11999990000',
        },
        renterToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('NOT_FOUND')
  })

  it('lista apenas eventos do tenant do ator dentro do período informado', async () => {
    const response = await GET(
      buildRequest(
        'GET',
        'http://localhost/api/agenda/events?from=2030-01-15T00:00:00.000Z&to=2030-01-17T00:00:00.000Z',
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    const titles = json.events.map((event: { title: string }) => event.title)
    expect(titles).toContain('Visita ao apartamento')
    expect(titles).toContain('Reunião externa')
  })

  it('não lista para um RENTER sem vínculo os eventos do tenant (agenda do time não vaza)', async () => {
    const response = await GET(
      buildRequest(
        'GET',
        'http://localhost/api/agenda/events?from=2030-01-15T00:00:00.000Z&to=2030-01-17T00:00:00.000Z',
        undefined,
        renterToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.events).toEqual([])
  })

  it('não retorna eventos fora do período informado', async () => {
    const response = await GET(
      buildRequest(
        'GET',
        'http://localhost/api/agenda/events?from=2030-02-01T00:00:00.000Z&to=2030-02-02T00:00:00.000Z',
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.events).toHaveLength(0)
  })

  it('retorna 400 quando "to" não é depois de "from"', async () => {
    const response = await GET(
      buildRequest(
        'GET',
        'http://localhost/api/agenda/events?from=2030-01-17T00:00:00.000Z&to=2030-01-15T00:00:00.000Z',
      ),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(
      buildRequest(
        'GET',
        'http://localhost/api/agenda/events?from=2030-01-15T00:00:00.000Z&to=2030-01-17T00:00:00.000Z',
        undefined,
        '',
      ),
    )

    expect(response.status).toBe(401)
  })
})
