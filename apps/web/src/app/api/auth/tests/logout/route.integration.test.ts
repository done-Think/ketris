import { randomUUID } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { POST as login } from '../../login/route'
import { POST as refresh } from '../../refresh/route'
import { POST as logout } from '../../logout/route'

describe('POST /api/auth/logout (integração)', () => {
  const tenantSlug = `test-tenant-${randomUUID()}`
  const email = `logout-${randomUUID()}@ketris.dev`
  const password = 'senha-correta-123'
  let tenantId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Logout', slug: tenantSlug },
    })
    tenantId = tenant.id

    await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Logout Teste',
        email,
        senhaHash: await bcrypt.hash(password, 10),
        papel: 'ADMIN',
      },
    })
  })

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(url: string, body: unknown): NextRequest {
    return new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async function loginAndGetRefreshToken(): Promise<string> {
    const response = await login(
      buildRequest('http://localhost/api/auth/login', { email, password }),
    )
    const json = await response.json()
    return json.refreshToken
  }

  it('retorna 204 e revoga o refresh token (não pode mais ser usado no refresh)', async () => {
    const refreshToken = await loginAndGetRefreshToken()

    const logoutResponse = await logout(
      buildRequest('http://localhost/api/auth/logout', { refreshToken }),
    )
    expect(logoutResponse.status).toBe(204)

    const refreshResponse = await refresh(
      buildRequest('http://localhost/api/auth/refresh', { refreshToken }),
    )
    const refreshJson = await refreshResponse.json()

    expect(refreshResponse.status).toBe(401)
    expect(refreshJson.error.code).toBe('INVALID_REFRESH_TOKEN')
  })

  it('retorna 204 mesmo para um refresh token que nunca existiu (idempotente)', async () => {
    const response = await logout(
      buildRequest('http://localhost/api/auth/logout', { refreshToken: 'token-que-nao-existe' }),
    )

    expect(response.status).toBe(204)
  })

  it('retorna 400 quando o corpo falha na validação Zod', async () => {
    const response = await logout(buildRequest('http://localhost/api/auth/logout', {}))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })
})
