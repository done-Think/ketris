import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { POST } from './route'

describe('POST /api/platform/tenants/[id]/admins (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string
  let tenantId: string

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

    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Novo', slug: `tenant-admin-${randomUUID()}` },
    })
    tenantId = tenant.id
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.platformAdminRefreshToken.deleteMany({ where: { platformAdminId: actorId } })
    await prisma.platformAdmin.delete({ where: { id: actorId } })
    await prisma.$disconnect()
  })

  function buildRequest(body: unknown, token?: string): NextRequest {
    return new NextRequest(`http://localhost/api/platform/tenants/${tenantId}/admins`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('cria o admin do tenant quando autenticado', async () => {
    const email = `admin-${randomUUID()}@ketris.dev`

    const response = await POST(
      buildRequest({ nome: 'Admin do Tenant', email, password: 'senha-longa-123' }, actorToken),
      { params: { id: tenantId } },
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.user.papel).toBe('ADMIN')
    expect(json.user.tenantId).toBe(tenantId)
  })

  it('permite criar um segundo admin para o mesmo tenant (sem restrição de janela única)', async () => {
    const email = `segundo-admin-${randomUUID()}@ketris.dev`

    const response = await POST(
      buildRequest({ nome: 'Segundo Admin', email, password: 'senha-longa-123' }, actorToken),
      { params: { id: tenantId } },
    )

    expect(response.status).toBe(201)
  })

  it('retorna 401 sem Authorization header', async () => {
    const response = await POST(
      buildRequest({
        nome: 'X',
        email: `x-${randomUUID()}@ketris.dev`,
        password: 'senha-longa-123',
      }),
      { params: { id: tenantId } },
    )

    expect(response.status).toBe(401)
  })

  it('retorna 404 para um tenant inexistente', async () => {
    const response = await POST(
      buildRequest(
        { nome: 'X', email: `x-${randomUUID()}@ketris.dev`, password: 'senha-longa-123' },
        actorToken,
      ),
      { params: { id: 'inexistente' } },
    )

    expect(response.status).toBe(404)
  })

  it('nunca aparece no contrato OpenAPI público (é a criação de admin de um tenant)', async () => {
    const { generateOpenApiDocument } = await import('@server/openapi/registry')
    const document = generateOpenApiDocument()

    expect(document.paths).not.toHaveProperty('/platform/tenants/{id}/admins')
  })
})
