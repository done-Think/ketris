import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePlatformTokenService } from '@server/platform/infrastructure/jose-platform-token.service'

import { GET, POST } from './route'

describe('/api/platform/admins (integração)', () => {
  const tokenService = new JosePlatformTokenService()
  let actorId: string
  let actorToken: string

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
  })

  afterAll(async () => {
    await prisma.platformAdminRefreshToken.deleteMany({ where: { platformAdminId: actorId } })
    await prisma.platformAdmin.deleteMany({ where: { id: actorId } })
    await prisma.$disconnect()
  })

  function buildRequest(method: string, body?: unknown, token?: string): NextRequest {
    return new NextRequest('http://localhost/api/platform/admins', {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    })
  }

  it('POST retorna 201 e o platform admin criado quando autenticado', async () => {
    const email = `novo-${randomUUID()}@ketris.dev`

    const response = await POST(
      buildRequest('POST', { nome: 'Novo Admin', email, password: 'senha-longa-123' }, actorToken),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.admin.email).toBe(email)
    expect(json.admin).not.toHaveProperty('senhaHash')

    await prisma.platformAdmin.delete({ where: { id: json.admin.id } })
  })

  it('POST retorna 401 sem Authorization header', async () => {
    const response = await POST(
      buildRequest('POST', {
        nome: 'X',
        email: `x-${randomUUID()}@ketris.dev`,
        password: 'senha-longa-123',
      }),
    )

    expect(response.status).toBe(401)
  })

  it('GET retorna 200 e a lista de platform admins quando autenticado', async () => {
    const response = await GET(buildRequest('GET', undefined, actorToken))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(json.admins)).toBe(true)
    expect(json.admins.some((admin: { id: string }) => admin.id === actorId)).toBe(true)
  })

  it('GET retorna 401 sem Authorization header', async () => {
    const response = await GET(buildRequest('GET'))

    expect(response.status).toBe(401)
  })

  it('POST /platform/admins nunca aparece no contrato OpenAPI público (é a criação de admin)', async () => {
    const { generateOpenApiDocument } = await import('@server/openapi/registry')
    const document = generateOpenApiDocument()
    const path = document.paths?.['/platform/admins'] as { post?: unknown } | undefined

    expect(path?.post).toBeUndefined()
  })
})
