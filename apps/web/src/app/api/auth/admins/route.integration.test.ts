import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'

import { GET, POST } from './route'

describe('POST /api/auth/admins (integração)', () => {
  const tenantSlug = `test-tenant-${randomUUID()}`
  const tokenService = new JoseTokenService()
  let tenantId: string
  let adminToken: string
  let agentToken: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({ data: { nome: 'Tenant Admins', slug: tenantSlug } })
    tenantId = tenant.id

    const admin = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Admin Teste',
        email: `admin-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })

    const agent = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Agente Teste',
        email: `agent-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })

    adminToken = await tokenService.sign({
      id: admin.id,
      tenantId: admin.tenantId,
      nome: admin.nome,
      email: admin.email,
      papel: admin.papel,
      ativo: admin.ativo,
    })

    agentToken = await tokenService.sign({
      id: agent.id,
      tenantId: agent.tenantId,
      nome: agent.nome,
      email: agent.email,
      papel: agent.papel,
      ativo: agent.ativo,
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(body: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/auth/admins', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('retorna 201 e o administrador criado quando o ator é ADMIN', async () => {
    const email = `novo-admin-${randomUUID()}@ketris.dev`

    const response = await POST(
      buildRequest({ nome: 'Novo Admin', email, password: 'senha-longa-123' }, adminToken),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.user.papel).toBe('ADMIN')
    expect(json.user.tenantId).toBe(tenantId)
    expect(json.user).not.toHaveProperty('senhaHash')
  })

  it('retorna 403 quando o ator autenticado não é ADMIN', async () => {
    const response = await POST(
      buildRequest(
        { nome: 'X', email: `x-${randomUUID()}@ketris.dev`, password: 'senha-longa-123' },
        agentToken,
      ),
    )
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await POST(
      buildRequest({
        nome: 'X',
        email: `x-${randomUUID()}@ketris.dev`,
        password: 'senha-longa-123',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('nunca aparece no contrato OpenAPI público (/api/docs/openapi.json)', async () => {
    const { generateOpenApiDocument } = await import('@server/openapi/registry')
    const document = generateOpenApiDocument()

    expect(document.paths).not.toHaveProperty('/auth/admins')
  })
})

describe('GET /api/auth/admins (integração)', () => {
  const tenantSlug = `test-tenant-list-${randomUUID()}`
  const tokenService = new JoseTokenService()
  let tenantId: string
  let adminToken: string
  let agentToken: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({ data: { nome: 'Tenant Admins', slug: tenantSlug } })
    tenantId = tenant.id

    const admin = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Admin Teste',
        email: `admin-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'ADMIN',
      },
    })

    await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Agente Teste',
        email: `agent-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
        papel: 'AGENT',
      },
    })

    adminToken = await tokenService.sign({
      id: admin.id,
      tenantId: admin.tenantId,
      nome: admin.nome,
      email: admin.email,
      papel: admin.papel,
      ativo: admin.ativo,
    })

    agentToken = await tokenService.sign({
      id: admin.id,
      tenantId: admin.tenantId,
      nome: admin.nome,
      email: admin.email,
      papel: 'AGENT',
      ativo: admin.ativo,
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildGetRequest(token?: string): NextRequest {
    return new NextRequest('http://localhost/api/auth/admins', {
      method: 'GET',
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('retorna apenas as contas ADMIN do tenant do ator', async () => {
    const response = await GET(buildGetRequest(adminToken))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admins).toHaveLength(1)
    expect(json.admins[0].papel).toBe('ADMIN')
    expect(json.admins[0]).not.toHaveProperty('senhaHash')
  })

  it('retorna 403 quando o ator autenticado não é ADMIN', async () => {
    const response = await GET(buildGetRequest(agentToken))
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await GET(buildGetRequest())

    expect(response.status).toBe(401)
  })
})
