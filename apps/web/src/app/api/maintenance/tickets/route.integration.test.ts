import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET as listActivities } from './[id]/activities/route'
import { POST as addNote } from './[id]/notes/route'
import { POST as resolveTicket } from './[id]/resolve/route'
import { DELETE, GET as getTicket, PATCH } from './[id]/route'
import { GET, POST } from './route'

describe('/api/maintenance/tickets (integração)', () => {
  const tokenService = new JoseTokenService()
  let tenantId: string
  let otherTenantId: string
  let actorToken: string
  let renterToken: string
  let otherTenantToken: string
  let propertyId: string
  let otherTenantPropertyId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Maintenance', slug: `maintenance-${randomUUID()}` },
    })
    tenantId = tenant.id

    const otherTenant = await prisma.tenant.create({
      data: { nome: 'Tenant Maintenance Outro', slug: `maintenance-outro-${randomUUID()}` },
    })
    otherTenantId = otherTenant.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Marina Costa',
        email: `corretor-${randomUUID()}@ketris.dev`,
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
        nome: 'Bruno Oliveira',
        email: `locatario-${randomUUID()}@ketris.dev`,
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

    const otherActor = await prisma.usuario.create({
      data: {
        tenantId: otherTenantId,
        nome: 'Outro Corretor',
        email: `outro-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    otherTenantToken = await tokenService.sign({
      id: otherActor.id,
      tenantId: otherActor.tenantId,
      nome: otherActor.nome,
      email: otherActor.email,
      papel: otherActor.papel,
      ativo: otherActor.ativo,
      vinculoAprovadoEm: otherActor.vinculoAprovadoEm,
    })

    const property = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: actor.id,
        titulo: 'Apt Jardins 3q',
        finalidade: 'ALUGUEL',
        tipo: 'apartamento',
        valor: 2500,
        status: 'PUBLISHED',
      },
    })
    propertyId = property.id

    const otherProperty = await prisma.imovel.create({
      data: {
        tenantId: otherTenantId,
        responsavelId: otherActor.id,
        titulo: 'Studio Pinheiros',
        finalidade: 'ALUGUEL',
        tipo: 'studio',
        valor: 1800,
        status: 'PUBLISHED',
      },
    })
    otherTenantPropertyId = otherProperty.id
  })

  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    if (otherTenantId) await prisma.tenant.delete({ where: { id: otherTenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(url: string, method: string, body?: unknown, token?: string): NextRequest {
    return new NextRequest(url, {
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

  const createPayload = {
    category: 'Hidráulica',
    priority: 'URGENTE',
    title: 'Vazamento na cozinha',
    description: 'A pia está vazando, água acumulando no armário.',
  }

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest('http://localhost/api/maintenance/tickets', 'GET'))

    expect(response.status).toBe(401)
  })

  it('retorna 404 ao criar chamado para um imóvel de outro tenant', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/maintenance/tickets',
        'POST',
        { ...createPayload, propertyId: otherTenantPropertyId },
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('MAINTENANCE_PROPERTY_NOT_FOUND')
  })

  let ticketId: string

  it('um RENTER também consegue abrir um chamado (simplificação: sem restrição de papel neste módulo)', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/maintenance/tickets',
        'POST',
        { ...createPayload, propertyId },
        renterToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.ticket.openedByName).toBe('Bruno Oliveira')
  })

  it('cria um chamado de manutenção para um imóvel do próprio tenant', async () => {
    const response = await POST(
      buildRequest(
        'http://localhost/api/maintenance/tickets',
        'POST',
        { ...createPayload, propertyId },
        actorToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.ticket.status).toBe('ABERTO')
    expect(json.ticket.propertyTitle).toBe('Apt Jardins 3q')
    expect(json.ticket.openedByName).toBe('Marina Costa')
    expect(json.ticket.activities).toEqual([])

    ticketId = json.ticket.id
  })

  it('lista os chamados do tenant do ator', async () => {
    const response = await GET(
      buildRequest('http://localhost/api/maintenance/tickets', 'GET', undefined, actorToken),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.items.map((item: { id: string }) => item.id)).toContain(ticketId)
  })

  it('retorna 404 ao consultar um chamado de outro tenant', async () => {
    const response = await getTicket(
      buildRequest(
        `http://localhost/api/maintenance/tickets/${ticketId}`,
        'GET',
        undefined,
        otherTenantToken,
      ),
      context(ticketId),
    )

    expect(response.status).toBe(404)
  })

  it('consulta o chamado pelo id dentro do próprio tenant', async () => {
    const response = await getTicket(
      buildRequest(
        `http://localhost/api/maintenance/tickets/${ticketId}`,
        'GET',
        undefined,
        actorToken,
      ),
      context(ticketId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.ticket.id).toBe(ticketId)
  })

  it('atualiza categoria e prioridade do chamado', async () => {
    const response = await PATCH(
      buildRequest(
        `http://localhost/api/maintenance/tickets/${ticketId}`,
        'PATCH',
        { category: 'Elétrica', priority: 'NORMAL' },
        actorToken,
      ),
      context(ticketId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.ticket.category).toBe('Elétrica')
    expect(json.ticket.priority).toBe('NORMAL')
  })

  it('adiciona uma nota na linha do tempo do chamado', async () => {
    const response = await addNote(
      buildRequest(
        `http://localhost/api/maintenance/tickets/${ticketId}/notes`,
        'POST',
        { message: 'Visita agendada para amanhã de manhã.' },
        actorToken,
      ),
      context(ticketId),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.activity.type).toBe('NOTA')
    expect(json.activity.message).toBe('Visita agendada para amanhã de manhã.')
    expect(json.activity.authorName).toBe('Marina Costa')
  })

  it('lista a linha do tempo do chamado com a nota registrada', async () => {
    const response = await listActivities(
      buildRequest(
        `http://localhost/api/maintenance/tickets/${ticketId}/activities`,
        'GET',
        undefined,
        actorToken,
      ),
      context(ticketId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.activities).toHaveLength(1)
    expect(json.activities[0].message).toBe('Visita agendada para amanhã de manhã.')
  })

  it('marca o chamado como resolvido e registra a mudança de status na linha do tempo', async () => {
    const response = await resolveTicket(
      buildRequest(
        `http://localhost/api/maintenance/tickets/${ticketId}/resolve`,
        'POST',
        undefined,
        actorToken,
      ),
      context(ticketId),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.ticket.status).toBe('RESOLVIDO')
    expect(json.ticket.resolvedAt).not.toBeNull()
    expect(json.ticket.activities).toHaveLength(2)
    expect(json.ticket.activities[1].type).toBe('MUDANCA_STATUS')
  })

  it('retorna 409 ao tentar resolver um chamado já resolvido', async () => {
    const response = await resolveTicket(
      buildRequest(
        `http://localhost/api/maintenance/tickets/${ticketId}/resolve`,
        'POST',
        undefined,
        actorToken,
      ),
      context(ticketId),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('MAINTENANCE_TICKET_ALREADY_RESOLVED')
  })

  it('exclui o chamado', async () => {
    const response = await DELETE(
      buildRequest(
        `http://localhost/api/maintenance/tickets/${ticketId}`,
        'DELETE',
        undefined,
        actorToken,
      ),
      context(ticketId),
    )

    expect(response.status).toBe(204)

    const afterDelete = await getTicket(
      buildRequest(
        `http://localhost/api/maintenance/tickets/${ticketId}`,
        'GET',
        undefined,
        actorToken,
      ),
      context(ticketId),
    )
    expect(afterDelete.status).toBe(404)
  })
})
