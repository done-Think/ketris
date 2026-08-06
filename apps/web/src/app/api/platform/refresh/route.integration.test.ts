import { randomUUID } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { POST as login } from '../login/route'
import { POST as refresh } from './route'

describe('POST /api/platform/refresh (integração)', () => {
  const email = `refresh-platform-${randomUUID()}@ketris.dev`
  const password = 'senha-correta-123'
  let adminId: string

  beforeAll(async () => {
    const admin = await prisma.platformAdmin.create({
      data: { nome: 'Refresh Teste', email, senhaHash: await bcrypt.hash(password, 10) },
    })
    adminId = admin.id
  })

  afterAll(async () => {
    await prisma.platformAdminRefreshToken.deleteMany({ where: { platformAdminId: adminId } })
    await prisma.platformAdmin.delete({ where: { id: adminId } })
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
      buildRequest('http://localhost/api/platform/login', { email, password }),
    )
    const json = await response.json()
    return json.refreshToken
  }

  it('retorna 200 com um novo access token e um novo refresh token', async () => {
    const refreshToken = await loginAndGetRefreshToken()

    const response = await refresh(
      buildRequest('http://localhost/api/platform/refresh', { refreshToken }),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(typeof json.accessToken).toBe('string')
    expect(json.refreshToken).not.toBe(refreshToken)
  })

  it('rotação: o refresh token usado uma vez não pode ser reutilizado (retorna 401)', async () => {
    const refreshToken = await loginAndGetRefreshToken()

    const primeira = await refresh(
      buildRequest('http://localhost/api/platform/refresh', { refreshToken }),
    )
    expect(primeira.status).toBe(200)

    const segunda = await refresh(
      buildRequest('http://localhost/api/platform/refresh', { refreshToken }),
    )
    const json = await segunda.json()

    expect(segunda.status).toBe(401)
    expect(json.error.code).toBe('INVALID_PLATFORM_REFRESH_TOKEN')
  })

  it('retorna 401 para um refresh token que nunca existiu', async () => {
    const response = await refresh(
      buildRequest('http://localhost/api/platform/refresh', {
        refreshToken: 'token-que-nao-existe',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_PLATFORM_REFRESH_TOKEN')
  })
})
