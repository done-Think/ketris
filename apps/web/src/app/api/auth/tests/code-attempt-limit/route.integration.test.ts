import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { hashPasswordResetCode } from '@server/auth/domain/password-reset-code'
import { emailDigest } from '@server/auth/infrastructure/rate-limit-code-attempt-limiter'
import { prisma } from '@server/db/prisma'

import { POST as confirmPublicEmailChange } from '../../email-change/verify/route'
import { POST as confirmSignup } from '../../email-verification-codes/verify/route'
import { POST as verifyPasswordReset } from '../../password-reset-codes/verify/route'

const HOURLY_LIMIT = 10
const validCode = '654321'
const wrongCode = '000000'
const emails: string[] = []
let tenantId: string

function post(path: string, body: unknown) {
  return new NextRequest(`http://localhost/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function uniqueEmail(label: string) {
  const email = `${label}-${randomUUID()}@attempts.example.test`
  emails.push(email)
  return email
}

async function guessUntilBudgetIsSpent(attempt: (code: string) => Promise<Response>) {
  for (let index = 0; index < HOURLY_LIMIT; index += 1) {
    expect((await attempt(wrongCode)).status).toBeLessThan(429)
  }
}

describe('cumulative code attempt limit per e-mail (integration)', () => {
  beforeAll(async () => {
    tenantId = (
      await prisma.tenant.create({
        data: { name: 'Code attempt limit', slug: `attempt-limit-${randomUUID()}` },
      })
    ).id
  })

  afterAll(async () => {
    for (const email of emails) {
      const hash = emailDigest(email)
      await prisma.$executeRaw`DELETE FROM "auth_rate_limit_buckets" WHERE "key" LIKE ${`%${hash}`}`
    }
    await prisma.emailOwnershipCode.deleteMany({ where: { email: { in: emails } } })
    await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('blocks password reset verification with a fresh valid code after the budget is spent across replaced codes', async () => {
    const email = uniqueEmail('reset')
    await prisma.user.create({
      data: { tenantId, name: 'Reset', email, passwordHash: 'unused', role: 'OWNER' },
    })
    const seedCode = async () => {
      await prisma.emailOwnershipCode.updateMany({
        where: { email, consumedAt: null },
        data: { consumedAt: new Date() },
      })
      await prisma.emailOwnershipCode.create({
        data: {
          email,
          codeHash: hashPasswordResetCode(validCode),
          expiresAt: new Date(Date.now() + 10 * 60_000),
        },
      })
    }

    await guessUntilBudgetIsSpent(async (code) => {
      await seedCode()
      return verifyPasswordReset(post('password-reset-codes/verify', { email, code }))
    })
    await seedCode()
    const blocked = await verifyPasswordReset(
      post('password-reset-codes/verify', { email, code: validCode }),
    )

    expect(blocked.status).toBe(429)
    expect((await blocked.json()).resetToken).toBeUndefined()
    expect(
      (await prisma.emailOwnershipCode.findFirstOrThrow({ where: { email, consumedAt: null } }))
        .attempts,
    ).toBe(0)
  })

  it('blocks signup e-mail confirmation with a fresh valid code after the budget is spent', async () => {
    const email = uniqueEmail('signup')
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: 'Signup',
        email,
        passwordHash: 'unused',
        role: 'OWNER',
        emailVerifiedAt: null,
      },
    })
    const seedCode = async () => {
      await prisma.emailVerificationCode.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      })
      await prisma.emailVerificationCode.create({
        data: {
          userId: user.id,
          tenantId,
          targetEmail: email,
          purpose: 'SIGNUP',
          codeHash: hashPasswordResetCode(validCode),
          expiresAt: new Date(Date.now() + 10 * 60_000),
        },
      })
    }

    await guessUntilBudgetIsSpent(async (code) => {
      await seedCode()
      return confirmSignup(post('email-verification-codes/verify', { email, tenantId, code }))
    })
    await seedCode()
    const blocked = await confirmSignup(
      post('email-verification-codes/verify', { email, tenantId, code: validCode }),
    )

    expect(blocked.status).toBe(429)
    expect((await blocked.json()).accessToken).toBeUndefined()
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt,
    ).toBeNull()
  })

  it('blocks e-mail change confirmation with a fresh valid code after the budget is spent', async () => {
    const currentEmail = uniqueEmail('current')
    const targetEmail = uniqueEmail('target')
    const user = await prisma.user.create({
      data: {
        tenantId,
        name: 'Change',
        email: currentEmail,
        passwordHash: 'unused',
        role: 'OWNER',
      },
    })
    const seedCode = async () => {
      await prisma.emailVerificationCode.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      })
      return prisma.emailVerificationCode.create({
        data: {
          userId: user.id,
          tenantId,
          targetEmail,
          purpose: 'EMAIL_CHANGE',
          codeHash: hashPasswordResetCode(validCode),
          expiresAt: new Date(Date.now() + 10 * 60_000),
        },
      })
    }

    await guessUntilBudgetIsSpent(async (code) => {
      const proof = await seedCode()
      return confirmPublicEmailChange(post('email-change/verify', { requestId: proof.id, code }))
    })
    const fresh = await seedCode()
    const blocked = await confirmPublicEmailChange(
      post('email-change/verify', { requestId: fresh.id, code: validCode }),
    )

    expect(blocked.status).toBe(429)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(
      currentEmail,
    )
  })

  it('still accepts the correct code after a few wrong attempts below the limit, and never spends budget on success', async () => {
    const email = uniqueEmail('below-limit')
    await prisma.user.create({
      data: { tenantId, name: 'Below', email, passwordHash: 'unused', role: 'OWNER' },
    })
    await prisma.emailOwnershipCode.create({
      data: {
        email,
        codeHash: hashPasswordResetCode(validCode),
        expiresAt: new Date(Date.now() + 10 * 60_000),
      },
    })

    for (let index = 0; index < 3; index += 1) {
      expect(
        (await verifyPasswordReset(post('password-reset-codes/verify', { email, code: wrongCode })))
          .status,
      ).toBe(401)
    }
    const accepted = await verifyPasswordReset(
      post('password-reset-codes/verify', { email, code: validCode }),
    )

    expect(accepted.status).toBe(200)
    expect(typeof (await accepted.json()).resetToken).toBe('string')
  })

  it('does not block another e-mail while one is exhausted', async () => {
    const email = uniqueEmail('isolated')
    const response = await verifyPasswordReset(
      post('password-reset-codes/verify', { email, code: wrongCode }),
    )
    expect(response.status).toBe(401)
  })
})
