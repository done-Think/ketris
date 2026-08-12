import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET, POST } from './route'

describe('/api/platform/tenants (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  let createdTenantId: string
  const existingTenantSlug = `existing-${randomUUID()}`

  beforeAll(async () => {
    const actor = await prisma.platformAdmin.create({
      data: {
        nome: 'Ator Teste',
        email: `ator-${randomUUID()}@ketris.dev`,
        senhaHash: 'hash-fake',
      },
    })
    actorId = actor.id
    actorToken = await tokenService.sign({
      id: actor.id,
      nome: actor.nome,
      email: actor.email,
      ativo: true,
    })

    await prisma.tenant.create({ data: { nome: 'Tenant Existente', slug: existingTenantSlug } })
  })

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { slug: { in: [existingTenantSlug] } } })
    if (createdTenantId)
      await prisma.tenant.delete({ where: { id: createdTenantId } }).catch(() => undefined)
    await prisma.platformAdminRefreshToken.deleteMany({ where: { platformAdminId: actorId } })
    await prisma.platformAdmin.delete({ where: { id: actorId } })
    await prisma.$disconnect()
  })

  function buildRequest(method: string, body?: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/platform/tenants', {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('GET retorna 200 e a lista de tenants quando autenticado', async () => {
    const response = await GET(buildRequest('GET', undefined, actorToken))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(
      json.tenants.some((tenant: { slug: string }) => tenant.slug === existingTenantSlug),
    ).toBe(true)
  })

  it('GET retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest('GET'))

    expect(response.status).toBe(401)
  })

  it('POST cria um novo tenant quando autenticado', async () => {
    const slug = `novo-${randomUUID()}`

    const response = await POST(buildRequest('POST', { nome: 'Novo Tenant', slug }, actorToken))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.tenant.slug).toBe(slug)
    createdTenantId = json.tenant.id
  })

  it('POST retorna 409 quando o slug já existe', async () => {
    const response = await POST(
      buildRequest('POST', { nome: 'Duplicado', slug: existingTenantSlug }, actorToken),
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('TENANT_SLUG_ALREADY_IN_USE')
  })

  it('POST retorna 401 sem Authorization header', async () => {
    const response = await POST(buildRequest('POST', { nome: 'X', slug: `x-${randomUUID()}` }))

    expect(response.status).toBe(401)
  })
})
