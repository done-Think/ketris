import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { POST } from './route'

describe('POST /api/auth/admins/bootstrap (integração)', () => {
  const createdTenantIds: string[] = []

  afterAll(async () => {
    for (const tenantId of createdTenantIds) {
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => undefined)
    }
    await prisma.$disconnect()
  })

  function buildRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/auth/admins/bootstrap', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('cria o primeiro admin de um tenant sem exigir autenticação', async () => {
    const tenantSlug = `bootstrap-tenant-${randomUUID()}`
    const tenant = await prisma.tenant.create({
      data: { nome: 'Bootstrap Tenant', slug: tenantSlug },
    })
    createdTenantIds.push(tenant.id)

    const email = `admin-${randomUUID()}@ketris.dev`

    const response = await POST(
      buildRequest({ tenantSlug, nome: 'Primeiro Admin', email, password: 'senha-longa-123' }),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.user.papel).toBe('ADMIN')
    expect(json.user.tenantId).toBe(tenant.id)
    expect(json.user).not.toHaveProperty('senhaHash')
  })

  it('retorna 409 numa segunda tentativa de bootstrap no mesmo tenant (janela já fechada)', async () => {
    const tenantSlug = `bootstrap-tenant-${randomUUID()}`
    const tenant = await prisma.tenant.create({
      data: { nome: 'Bootstrap Tenant', slug: tenantSlug },
    })
    createdTenantIds.push(tenant.id)

    const first = await POST(
      buildRequest({
        tenantSlug,
        nome: 'Primeiro Admin',
        email: `admin-${randomUUID()}@ketris.dev`,
        password: 'senha-longa-123',
      }),
    )
    expect(first.status).toBe(201)

    const second = await POST(
      buildRequest({
        tenantSlug,
        nome: 'Segundo Admin',
        email: `outro-${randomUUID()}@ketris.dev`,
        password: 'senha-longa-123',
      }),
    )
    const json = await second.json()

    expect(second.status).toBe(409)
    expect(json.error.code).toBe('ADMIN_ALREADY_EXISTS')
  })

  it('retorna 404 quando o tenantSlug não existe', async () => {
    const response = await POST(
      buildRequest({
        tenantSlug: `tenant-inexistente-${randomUUID()}`,
        nome: 'X',
        email: `x-${randomUUID()}@ketris.dev`,
        password: 'senha-longa-123',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('TENANT_NOT_FOUND')
  })

  it('retorna 400 quando o corpo da requisição é inválido', async () => {
    const response = await POST(
      buildRequest({ tenantSlug: '', nome: '', email: 'invalido', password: '123' }),
    )

    expect(response.status).toBe(400)
  })

  it('nunca aparece no contrato OpenAPI público (/api/docs/openapi.json)', async () => {
    const { generateOpenApiDocument } = await import('@server/openapi/registry')
    const document = generateOpenApiDocument()

    expect(document.paths).not.toHaveProperty('/auth/admins/bootstrap')
  })
})
