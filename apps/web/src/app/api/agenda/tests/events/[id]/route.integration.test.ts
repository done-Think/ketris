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
  let eventId: string
  let otherTenantEventId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Agenda Detail', slug: `agenda-detail-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { nome: 'Other Agenda Detail', slug: `other-agenda-detail-${randomUUID()}` },
    })
    otherTenantId = otherTenant.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Corretor Agenda',
        email: `corretor-agenda-detail-${randomUUID()}@ketris.dev`,
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
        responsavelId: actor.id,
        criadoPorId: actor.id,
        titulo: 'Follow-up com cliente',
        tipo: 'FOLLOW_UP',
        referenciaImovelLivre: 'Apto fora da carteira',
        inicio: new Date('2026-10-10T13:00:00.000Z'),
        fim: new Date('2026-10-10T13:30:00.000Z'),
        participanteNome: 'Ana',
        participanteTelefone: '11999990000',
      },
    })
    eventId = event.id

    const otherTenantActor = await prisma.usuario.create({
      data: {
        tenantId: otherTenantId,
        nome: 'Outro Corretor',
        email: `outro-agenda-detail-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    const otherTenantEvent = await prisma.eventoAgenda.create({
      data: {
        tenantId: otherTenantId,
        responsavelId: otherTenantActor.id,
        criadoPorId: otherTenantActor.id,
        titulo: 'Evento de outro tenant',
        referenciaImovelLivre: 'Externo',
        inicio: new Date('2026-10-10T13:00:00.000Z'),
        fim: new Date('2026-10-10T13:30:00.000Z'),
        participanteNome: 'X',
        participanteTelefone: '0',
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

  it('retorna 400 ao marcar como VISIT um evento com menos de 60 minutos', async () => {
    const response = await PATCH(
      buildRequest('PATCH', eventId, { kind: 'VISIT' }),
      context(eventId),
    )

    expect(response.status).toBe(400)
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest('GET', eventId, undefined, ''), context(eventId))

    expect(response.status).toBe(401)
  })
})
