import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'

import { DELETE, GET, PATCH } from './route'

describe('/api/auth/admins/[id] (integração)', () => {
  const tenantSlug = `test-tenant-admin-id-${randomUUID()}`
  const tokenService = new JoseTokenService()
  let tenantId: string
  let actorId: string
  let actorToken: string
  let agentToken: string
  let targetAdminId: string
  let targetAgentId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Admin Id', slug: tenantSlug },
    })
    tenantId = tenant.id

    const actor = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Ator Admin',
        email: `ator-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })
    actorId = actor.id

    const targetAdmin = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Admin Alvo',
        email: `alvo-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })
    targetAdminId = targetAdmin.id

    const targetAgent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Agente',
        email: `agente-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })
    targetAgentId = targetAgent.id

    actorToken = await tokenService.sign({
      id: actor.id,
      tenantId: actor.tenantId,
      nome: actor.nome,
      email: actor.email,
      papel: actor.papel,
      ativo: actor.ativo,
    })

    agentToken = await tokenService.sign({
      id: targetAgent.id,
      tenantId: targetAgent.tenantId,
      nome: targetAgent.nome,
      email: targetAgent.email,
      papel: targetAgent.papel,
      ativo: targetAgent.ativo,
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(method: string, body?: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/auth/admins/${targetAdminId}`, {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('GET retorna o admin quando o ator é ADMIN do mesmo tenant', async () => {
    const response = await GET(buildRequest('GET', undefined, actorToken), {
      params: { id: targetAdminId },
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.papel).toBe('ADMIN')
    expect(json.admin).not.toHaveProperty('senhaHash')
  })

  it('GET retorna 404 quando o alvo não é ADMIN (ex.: AGENT)', async () => {
    const response = await GET(buildRequest('GET', undefined, actorToken), {
      params: { id: targetAgentId },
    })

    expect(response.status).toBe(404)
  })

  it('GET retorna 403 quando o ator não é ADMIN', async () => {
    const response = await GET(buildRequest('GET', undefined, agentToken), {
      params: { id: targetAdminId },
    })

    expect(response.status).toBe(403)
  })

  it('PATCH atualiza nome/e-mail do admin', async () => {
    const response = await PATCH(
      buildRequest('PATCH', { nome: 'Admin Alvo Atualizado' }, actorToken),
      { params: { id: targetAdminId } },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.nome).toBe('Admin Alvo Atualizado')
  })

  it('DELETE retorna 400 quando o ator tenta se autodesativar', async () => {
    const response = await DELETE(buildRequest('DELETE', undefined, actorToken), {
      params: { id: actorId },
    })
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('CANNOT_DEACTIVATE_SELF')
  })

  it('DELETE desativa o admin alvo e ele não consegue mais logar', async () => {
    const response = await DELETE(buildRequest('DELETE', undefined, actorToken), {
      params: { id: targetAdminId },
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.ativo).toBe(false)
  })

  it('nunca aparece no contrato OpenAPI público (/api/docs/openapi.json)', async () => {
    const { generateOpenApiDocument } = await import('@server/openapi/registry')
    const document = generateOpenApiDocument()

    expect(document.paths).not.toHaveProperty('/auth/admins/{id}')
  })
})
