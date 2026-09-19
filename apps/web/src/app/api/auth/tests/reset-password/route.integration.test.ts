import { randomUUID } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import { POST as login } from '../../login/route'
import { POST as resetPassword } from '../../reset-password/route'

describe('POST /api/auth/reset-password (integração)', () => {
  const tenantSlug = `test-tenant-${randomUUID()}`
  const email = `reset-${randomUUID()}@ketris.dev`
  const oldPassword = 'senha-antiga-123'
  let tenantId: string
  let userId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Reset', slug: tenantSlug },
    })
    tenantId = tenant.id

    const usuario = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Reset Teste',
        email,
        senhaHash: await bcrypt.hash(oldPassword, 10),
        papel: 'ADMIN',
      },
    })
    userId = usuario.id
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

  it('altera a senha no banco e revoga os refresh tokens existentes do usuário', async () => {
    const newPassword = 'senha-nova-456'

    await prisma.refreshToken.create({
      data: {
        userId,
        tenantId,
        tokenHash: `hash-fake-${randomUUID()}`,
        expiresAt: new Date(Date.now() + 60_000),
      },
    })

    const response = await resetPassword(
      buildRequest('http://localhost/api/auth/reset-password', {
        email,
        password: newPassword,
      }),
    )
    expect(response.status).toBe(204)

    const updated = await prisma.usuario.findUniqueOrThrow({ where: { id: userId } })
    expect(await bcrypt.compare(newPassword, updated.senhaHash)).toBe(true)
    expect(await bcrypt.compare(oldPassword, updated.senhaHash)).toBe(false)

    const remainingTokens = await prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    })
    expect(remainingTokens).toHaveLength(0)

    const loginWithNewPassword = await login(
      buildRequest('http://localhost/api/auth/login', { email, password: newPassword }),
    )
    expect(loginWithNewPassword.status).toBe(200)

    const loginWithOldPassword = await login(
      buildRequest('http://localhost/api/auth/login', { email, password: oldPassword }),
    )
    expect(loginWithOldPassword.status).toBe(401)
  })

  it('retorna 204 mesmo para um e-mail que não existe (anti-enumeração)', async () => {
    const response = await resetPassword(
      buildRequest('http://localhost/api/auth/reset-password', {
        email: 'nao-existe@ketris.dev',
        password: 'qualquer-senha-123',
      }),
    )

    expect(response.status).toBe(204)
  })

  it('retorna 400 quando o corpo falha na validação Zod', async () => {
    const response = await resetPassword(
      buildRequest('http://localhost/api/auth/reset-password', {
        email,
        password: '123',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })
})
