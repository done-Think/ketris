import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '@server/db/prisma'
import { hashPasswordResetCode } from '@server/auth/domain/password-reset-code'
import { SesMailer } from '@server/shared/email/ses-mailer'

import { POST as requestCode } from '../../email-verification-codes/route'
import { POST as confirmCode } from '../../email-verification-codes/verify/route'

const send = vi.spyOn(SesMailer.prototype, 'send').mockResolvedValue(undefined)
let tenantId: string

function request(body: unknown) {
  return new NextRequest('http://localhost/api/auth/email-verification-codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function createUser() {
  return prisma.user.create({
    data: {
      tenantId,
      name: 'Verification',
      email: `${randomUUID()}@verification.example.test`,
      passwordHash: 'not-used-in-this-flow',
      role: 'OWNER',
      emailVerifiedAt: null,
    },
  })
}

function latestCode(): string {
  const text = send.mock.calls.at(-1)?.[0].text ?? ''
  const code = text.match(/\b\d{6}\b/)?.[0]
  if (!code) throw new Error('Verification email did not contain a six-digit code')
  return code
}

describe('signup email verification API', () => {
  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Email verification', slug: `verification-${randomUUID()}` },
    })
    tenantId = tenant.id
  })
  beforeEach(() => send.mockClear())
  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    send.mockRestore()
  })

  it.each(['pt-BR', 'en-US', 'es-ES'] as const)(
    'sends a real localized code through the mailer and stores only its hash (%s)',
    async (locale) => {
      const user = await createUser()
      const response = await requestCode(request({ email: user.email, tenantId, locale }))
      expect(response.status).toBe(204)
      expect(send.mock.calls.length).toBe(1)
      const code = latestCode()
      const stored = await prisma.emailVerificationCode.findFirstOrThrow({
        where: { userId: user.id },
      })
      expect(stored.codeHash === code).toBe(false)
      expect(stored.codeHash === hashPasswordResetCode(code)).toBe(true)
      expect(stored.tenantId).toBe(tenantId)
      expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0)
      const result = await confirmCode(request({ email: user.email, tenantId, code }))
      expect(result.status).toBe(200)
      const body = await result.json()
      expect(body.outcome).toBe('REGISTERED')
      expect(typeof body.accessToken).toBe('string')
      expect(typeof body.refreshToken).toBe('string')
      const verified = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
      expect(verified.emailVerifiedAt).not.toBeNull()
      expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(1)
    },
  )

  it('limits wrong attempts and refuses a correct code after five failures', async () => {
    const user = await createUser()
    await requestCode(request({ email: user.email, tenantId, locale: 'pt-BR' }))
    const code = latestCode()
    const incorrect = code === '000000' ? '000001' : '000000'
    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await confirmCode(request({ email: user.email, tenantId, code: incorrect }))
      expect(response.status).toBe(400)
    }
    const correctAfterLimit = await confirmCode(request({ email: user.email, tenantId, code }))
    expect(correctAfterLimit.status).toBe(400)
    const stored = await prisma.emailVerificationCode.findFirstOrThrow({
      where: { userId: user.id },
    })
    expect(stored.attempts).toBe(5)
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0)
  })

  it('refuses expired codes without issuing a session', async () => {
    const user = await createUser()
    await requestCode(request({ email: user.email, tenantId, locale: 'pt-BR' }))
    const code = latestCode()
    await prisma.emailVerificationCode.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })
    const response = await confirmCode(request({ email: user.email, tenantId, code }))
    expect(response.status).toBe(400)
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0)
  })

  it('accepts a code at most once when confirmations race', async () => {
    const user = await createUser()
    await requestCode(request({ email: user.email, tenantId, locale: 'pt-BR' }))
    const code = latestCode()
    const responses = await Promise.all([
      confirmCode(request({ email: user.email, tenantId, code })),
      confirmCode(request({ email: user.email, tenantId, code })),
    ])
    expect(responses.map((response) => response.status).sort()).toEqual([200, 400])
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(1)
    expect((await confirmCode(request({ email: user.email, tenantId, code }))).status).toBe(400)
  })

  it('serializes concurrent resends and enforces the minimum interval', async () => {
    const user = await createUser()
    const responses = await Promise.all([
      requestCode(request({ email: user.email, tenantId, locale: 'pt-BR' })),
      requestCode(request({ email: user.email, tenantId, locale: 'pt-BR' })),
    ])
    expect(responses.map((response) => response.status).sort()).toEqual([204, 204])
    expect(send.mock.calls.length).toBe(1)
    expect(await prisma.emailVerificationCode.count({ where: { userId: user.id } })).toBe(1)
  })

  it('requires membership approval in addition to successful email verification', async () => {
    const user = await createUser()
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'AGENT', membershipApprovedAt: null },
    })
    await requestCode(request({ email: user.email, tenantId, locale: 'pt-BR' }))
    const response = await confirmCode(request({ email: user.email, tenantId, code: latestCode() }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.outcome).toBe('PENDING_APPROVAL')
    expect('accessToken' in body).toBe(false)
    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0)
  })

  it('does not reveal whether an unknown email exists and does not send mail for an already verified account', async () => {
    const user = await createUser()
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } })
    for (const email of [user.email, `${randomUUID()}@missing.example.test`]) {
      expect((await requestCode(request({ email, tenantId, locale: 'pt-BR' }))).status).toBe(204)
    }
    expect(send.mock.calls.length).toBe(0)
  })

  it('does not verify an account through a different tenant', async () => {
    const user = await createUser()
    await requestCode(request({ email: user.email, tenantId, locale: 'pt-BR' }))
    const result = await confirmCode(
      request({ email: user.email, tenantId: 'other-tenant', code: latestCode() }),
    )
    expect(result.status).toBe(400)
    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    expect(unchanged.emailVerifiedAt).toBeNull()
  })
})
