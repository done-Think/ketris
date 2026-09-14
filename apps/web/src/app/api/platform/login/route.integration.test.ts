import { randomUUID } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { POST } from './route'

describe('POST /api/platform/login (integração)', () => {
  const email = `login-platform-${randomUUID()}@ketris.dev`
  const password = 'senha-correta-123'
  let adminId: string

  beforeAll(async () => {
    const admin = await prisma.platformAdmin.create({
      data: { nome: 'Login Teste', email, senhaHash: await bcrypt.hash(password, 10) },
    })
    adminId = admin.id
  })

  afterAll(async () => {
    await prisma.platformAdminRefreshToken.deleteMany({ where: { platformAdminId: adminId } })
    await prisma.platformAdmin.delete({ where: { id: adminId } })
    await prisma.$disconnect()
  })

  function buildRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/platform/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('retorna 200, o admin (sem senhaHash), access token e refresh token com credenciais corretas', async () => {
    const response = await POST(buildRequest({ email, password }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.admin.email).toBe(email)
    expect(json.admin).not.toHaveProperty('senhaHash')
    expect(typeof json.accessToken).toBe('string')
    expect(typeof json.refreshToken).toBe('string')
  })

  it('retorna 401 com senha errada, com mensagem genérica', async () => {
    const response = await POST(buildRequest({ email, password: 'senha-errada' }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_PLATFORM_CREDENTIALS')
  })

  it('retorna 401 com e-mail inexistente, mesma mensagem genérica (anti-enumeração)', async () => {
    const response = await POST(buildRequest({ email: 'inexistente@ketris.dev', password }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_PLATFORM_CREDENTIALS')
  })

  it('o access token emitido carrega scope: platform e nenhum tenantId', async () => {
    const response = await POST(buildRequest({ email, password }))
    const json = await response.json()

    const { JosePlatformTokenService } =
      await import('@server/platform/infrastructure/jose-platform-token.service')
    const payload = await new JosePlatformTokenService().verify(json.accessToken)

    expect(payload.scope).toBe('platform')
    expect(payload.sub).toBe(adminId)
    expect(payload).not.toHaveProperty('tenantId')
  })
})
