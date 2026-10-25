import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'
import { hashPasswordResetCode } from '@server/auth/domain/password-reset-code'
import { JosePasswordResetTokenService } from '@server/auth/infrastructure/jose-password-reset-token.service'

import { POST as verifyCode } from '../../../password-reset-codes/verify/route'
import { POST as resetPassword } from '../../../reset-password/route'

describe('POST /api/auth/password-reset-codes/verify (integração)', () => {
  const tenantSlug = `test-tenant-${randomUUID()}`
  const email = `verify-code-${randomUUID()}@ketris.dev`
  const validCode = '654321'
  let tenantId: string
  let userId: string

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { nome: 'Tenant Verify Code', slug: tenantSlug },
    })
    tenantId = tenant.id

    const usuario = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Verifica Código',
        email,
        senhaHash: 'hash-fake',
        papel: 'OWNER',
      },
    })
    userId = usuario.id
  })

  afterAll(async () => {
    await prisma.emailOwnershipCode.deleteMany({ where: { email } })
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  function buildRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/auth/password-reset-codes/verify', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async function seedActiveCode(overrides?: { attempts?: number; expiresAt?: Date }) {
    await prisma.emailOwnershipCode.updateMany({
      where: { email, consumedAt: null },
      data: { consumedAt: new Date() },
    })

    return prisma.emailOwnershipCode.create({
      data: {
        email,
        codeHash: hashPasswordResetCode(validCode),
        attempts: overrides?.attempts ?? 0,
        expiresAt: overrides?.expiresAt ?? new Date(Date.now() + 10 * 60_000),
      },
    })
  }

  it('devolve um resetToken válido quando o código bate, e esse token funciona no reset-password', async () => {
    await seedActiveCode()

    const response = await verifyCode(buildRequest({ email, code: validCode }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(typeof json.resetToken).toBe('string')

    const passwordResetTokenService = new JosePasswordResetTokenService()
    const userIdFromToken = await passwordResetTokenService.verify(json.resetToken)
    expect(userIdFromToken).toEqual({ userId, sessionVersion: 0 })

    const resetResponse = await resetPassword(
      new NextRequest('http://localhost/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'senha-pos-codigo-123',
          resetToken: json.resetToken,
        }),
      }),
    )
    expect(resetResponse.status).toBe(204)
  })

  it('retorna 401 e incrementa as tentativas quando o código está errado', async () => {
    const code = await seedActiveCode()

    const response = await verifyCode(buildRequest({ email, code: '000000' }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_RESET_CODE')

    const updated = await prisma.emailOwnershipCode.findUniqueOrThrow({ where: { id: code.id } })
    expect(updated.attempts).toBe(1)
  })

  it('retorna 401 quando o código já expirou', async () => {
    await seedActiveCode({ expiresAt: new Date(Date.now() - 60_000) })

    const response = await verifyCode(buildRequest({ email, code: validCode }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_RESET_CODE')
  })

  it('retorna 401 quando as tentativas já se esgotaram, mesmo com o código certo', async () => {
    await seedActiveCode({ attempts: 5 })

    const response = await verifyCode(buildRequest({ email, code: validCode }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_RESET_CODE')
  })

  it('retorna 401 para um e-mail que não existe (anti-enumeração)', async () => {
    const response = await verifyCode(
      buildRequest({ email: 'nao-existe@ketris.dev', code: validCode }),
    )
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('INVALID_RESET_CODE')
  })

  it('retorna 400 quando o código não tem 6 dígitos', async () => {
    const response = await verifyCode(buildRequest({ email, code: '123' }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })
  it('proves mailbox ownership before listing duplicate accounts and resets only the selected account', async () => {
    const other = await prisma.tenant.create({
      data: { nome: 'Other verified account', slug: `other-${randomUUID()}` },
    })
    const second = await prisma.usuario.create({
      data: {
        tenantId: other.id,
        nome: 'Same mailbox',
        email,
        senhaHash: 'original-second-hash',
        papel: 'OWNER',
        emailVerificadoEm: null,
      },
    })
    try {
      await seedActiveCode()
      const invalid = await verifyCode(buildRequest({ email, code: '000000' }))
      expect(invalid.status).toBe(401)
      expect(await invalid.json()).not.toHaveProperty('tenants')
      const selection = await verifyCode(buildRequest({ email, code: validCode }))
      const options = await selection.json()
      expect(options.outcome).toBe('SELECT_TENANT')
      expect(options.tenants).toHaveLength(2)
      expect(options).not.toHaveProperty('resetToken')
      const active = await prisma.emailOwnershipCode.count({ where: { email, consumedAt: null } })
      expect(active).toBe(1)
      const original = await prisma.usuario.findUniqueOrThrow({ where: { id: userId } })
      const response = await verifyCode(
        buildRequest({ email, code: validCode, tenantId: other.id }),
      )
      const { resetToken } = await response.json()
      const reset = await resetPassword(
        new NextRequest('http://localhost/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'new-selected-password',
            resetToken,
            tenantId: other.id,
          }),
        }),
      )
      expect(reset.status).toBe(204)
      expect((await prisma.usuario.findUniqueOrThrow({ where: { id: userId } })).senhaHash).toBe(
        original.senhaHash,
      )
      const updated = await prisma.usuario.findUniqueOrThrow({ where: { id: second.id } })
      expect(updated.senhaHash).not.toBe('original-second-hash')
      expect(updated.emailVerificadoEm).toBeNull()
      const replay = await verifyCode(buildRequest({ email, code: validCode, tenantId: other.id }))
      expect(replay.status).toBe(401)
    } finally {
      await prisma.tenant.delete({ where: { id: other.id } })
    }
  })
})
