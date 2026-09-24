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
      data: { nome: 'Tenant Agenda', slug: `agenda-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { nome: 'Other Agenda', slug: `other-agenda-${randomUUID()}` },
    })
    otherTenantId = otherTenant.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor Agenda',
        email: `corretor-agenda-${randomUUID()}@ketris.dev`,
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

    const renter = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Locatário Agenda',
        email: `locatario-agenda-${randomUUID()}@ketris.dev`,
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

    const property = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: actor.id,
        titulo: 'Imóvel da agenda',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 2500,
        status: 'DRAFT',
      },
    })
    propertyId = property.id

    const otherTenantActor = await prisma.usuario.create({
      data: {
        tenantId: otherTenantId,
        nome: 'Outro Corretor',
        email: `outro-agenda-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    const otherProperty = await prisma.imovel.create({
      data: {
        tenantId: otherTenantId,
        responsavelId: otherTenantActor.id,
        titulo: 'Imóvel de outro tenant',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 1800,
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
        start: '2026-10-05T13:00:00.000Z',
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
    expect(json.event.start).toBe('2026-10-05T13:00:00.000Z')
    expect(json.event.end).toBe('2026-10-05T14:00:00.000Z')
  })

  it('cria evento com referência livre de imóvel, sem propertyId', async () => {
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/agenda/events', {
        title: 'Reunião externa',
        propertyReference: 'Escritório do cliente',
        start: '2026-10-06T10:00:00.000Z',
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
        start: '2026-10-06T10:00:00.000Z',
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
        start: '2026-10-06T10:00:00.000Z',
        durationMinutes: 30,
        participantName: 'Marcos Lima',
        participantPhone: '(11) 98731-4402',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('NOT_FOUND')
  })

  it('retorna 400 quando uma visita (kind VISIT) tem duração menor que 60 minutos', async () => {
    const response = await POST(
      buildRequest('POST', 'http://localhost/api/agenda/events', {
        title: 'Visita rápida demais',
        kind: 'VISIT',
        propertyId,
        start: '2026-10-06T15:00:00.000Z',
        durationMinutes: 30,
        participantName: 'Marcos Lima',
        participantPhone: '(11) 98731-4402',
      }),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 409 quando o responsável já tem um evento nesse horário', async () => {
    const conflictingStart = '2026-10-05T13:30:00.000Z'

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

  it('retorna 403 quando um RENTER tenta criar evento', async () => {
    const response = await POST(
      buildRequest(
        'POST',
        'http://localhost/api/agenda/events',
        {
          title: 'Tentativa de locatário',
          propertyId,
          start: '2026-10-06T10:00:00.000Z',
          durationMinutes: 30,
          participantName: 'Locatário X',
          participantPhone: '11999990000',
        },
        renterToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('lista apenas eventos do tenant do ator dentro do período informado', async () => {
    const response = await GET(
      buildRequest(
        'GET',
        'http://localhost/api/agenda/events?from=2026-10-05T00:00:00.000Z&to=2026-10-07T00:00:00.000Z',
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    const titles = json.events.map((event: { title: string }) => event.title)
    expect(titles).toContain('Visita ao apartamento')
    expect(titles).toContain('Reunião externa')
  })

  it('não retorna eventos fora do período informado', async () => {
    const response = await GET(
      buildRequest(
        'GET',
        'http://localhost/api/agenda/events?from=2026-11-01T00:00:00.000Z&to=2026-11-02T00:00:00.000Z',
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
        'http://localhost/api/agenda/events?from=2026-10-07T00:00:00.000Z&to=2026-10-05T00:00:00.000Z',
      ),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(
      buildRequest(
        'GET',
        'http://localhost/api/agenda/events?from=2026-10-05T00:00:00.000Z&to=2026-10-07T00:00:00.000Z',
        undefined,
        '',
      ),
    )

    expect(response.status).toBe(401)
  })
})
