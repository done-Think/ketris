import { randomUUID } from 'node:crypto'

import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { JosePasswordResetTokenService } from '@server/auth/infrastructure/jose-password-reset-token.service'

import { POST as login } from '../../login/route'
import { POST as resetPassword } from '../../reset-password/route'

describe('POST /api/auth/reset-password (integração)', () => {
  const tenantSlug = `test-tenant-${randomUUID()}`
  const email = `reset-${randomUUID()}@ketris.dev`
  const oldPassword = 'senha-antiga-123'
  const passwordResetTokenService = new JosePasswordResetTokenService()
  let tenantId: string
  let userId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Reset', slug: tenantSlug },
    })
    tenantId = tenant.id

    const user = await prisma.user.create({
      data: {
        tenantId,
        name: 'Reset Teste',
        email,
        passwordHash: await bcrypt.hash(oldPassword, 10),
        role: 'OWNER',
      },
    })
    userId = user.id
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

    const resetToken = await passwordResetTokenService.issue(userId, 0)

    const response = await resetPassword(
      buildRequest('http://localhost/api/auth/reset-password', {
        email,
        password: newPassword,
        resetToken,
      }),
    )
    expect(response.status).toBe(204)

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(await bcrypt.compare(newPassword, updated.passwordHash)).toBe(true)
    expect(await bcrypt.compare(oldPassword, updated.passwordHash)).toBe(false)

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
    const replay = await resetPassword(
      buildRequest('http://localhost/api/auth/reset-password', {
        email,
        password: 'replayed-password',
        resetToken,
      }),
    )
    expect(replay.status).toBe(401)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).sessionVersion).toBe(1)
  })

  it('retorna o mesmo erro de token inválido independentemente do e-mail', async () => {
    const response = await resetPassword(
      buildRequest('http://localhost/api/auth/reset-password', {
        email: 'nao-existe@ketris.dev',
        password: 'qualquer-senha-123',
        resetToken: 'qualquer-coisa',
      }),
    )

    expect(response.status).toBe(401)
  })

  it('retorna 400 quando o corpo falha na validação Zod', async () => {
    const response = await resetPassword(
      buildRequest('http://localhost/api/auth/reset-password', {
        email,
        password: '123',
        resetToken: 'qualquer-coisa',
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('retorna 401 quando o resetToken é inválido, ausente ou de outro usuário', async () => {
    const outroUser = await prisma.user.create({
      data: {
        tenantId,
        name: 'Outro Usuário',
        email: `reset-outro-${randomUUID()}@ketris.dev`,
        passwordHash: await bcrypt.hash('senha-qualquer-123', 10),
        role: 'OWNER',
      },
    })
    const resetTokenDeOutroUser = await passwordResetTokenService.issue(outroUser.id, 0)

    const response = await resetPassword(
      buildRequest('http://localhost/api/auth/reset-password', {
        email,
        password: 'senha-nova-789',
        resetToken: resetTokenDeOutroUser,
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_RESET_TOKEN')

    await prisma.user.delete({ where: { id: outroUser.id } })
  })
})
