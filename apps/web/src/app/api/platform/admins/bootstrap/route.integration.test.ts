import { NextRequest } from 'next/server'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { POST } from './route'

describe('POST /api/platform/admins/bootstrap (integração)', () => {
  beforeEach(async () => {
    await prisma.platformAdminRefreshToken.deleteMany()
    await prisma.platformAdmin.deleteMany()
    await prisma.platformSettings.deleteMany()
  })

  afterAll(async () => {
    await prisma.platformAdminRefreshToken.deleteMany()
    await prisma.platformAdmin.deleteMany()
    await prisma.platformSettings.deleteMany()
    await prisma.$disconnect()
  })

  function buildRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/platform/admins/bootstrap', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('cria o primeiro platform admin sem exigir autenticação', async () => {
    const response = await POST(
      buildRequest({
        nome: 'Primeiro Admin',
        email: 'dono@ketris.dev',
        password: 'senha-longa-123',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.admin.email).toBe('dono@ketris.dev')
    expect(json.admin).not.toHaveProperty('senhaHash')
  })

  it('retorna 409 numa segunda tentativa de bootstrap (janela global já fechada)', async () => {
    const first = await POST(
      buildRequest({
        nome: 'Primeiro Admin',
        email: 'dono@ketris.dev',
        password: 'senha-longa-123',
      }),
    )
    expect(first.status).toBe(201)

    const second = await POST(
      buildRequest({
        nome: 'Outro Admin',
        email: 'outro@ketris.dev',
        password: 'senha-longa-123',
      }),
    )
    const json = await second.json()

    expect(second.status).toBe(409)
    expect(json.error.code).toBe('PLATFORM_ALREADY_BOOTSTRAPPED')
  })

  it('retorna 400 quando o corpo da requisição é inválido', async () => {
    const response = await POST(buildRequest({ nome: '', email: 'invalido', password: '123' }))

    expect(response.status).toBe(400)
  })

  it('nunca aparece no contrato OpenAPI público (/api/docs/openapi.json)', async () => {
    const { generateOpenApiDocument } = await import('@server/openapi/registry')
    const document = generateOpenApiDocument()

    expect(document.paths).not.toHaveProperty('/platform/admins/bootstrap')
  })
})
