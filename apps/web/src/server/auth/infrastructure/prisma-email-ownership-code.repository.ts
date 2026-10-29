import { timingSafeEqual } from 'node:crypto'
import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { EmailOwnershipCodeRepository } from '../application/ports/email-ownership-code-repository.port'
import {
  PASSWORD_RESET_CODE_MAX_ATTEMPTS,
  PASSWORD_RESET_RESEND_SECONDS,
} from '../domain/password-reset-code'
import type { NewEmailOwnershipCode, VerifyEmailOwnershipCode } from '../types/password-reset'

export class PrismaEmailOwnershipCodeRepository implements EmailOwnershipCodeRepository {
  replace(input: NewEmailOwnershipCode): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const lockKey = `password-reset:${input.email}`
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`,
      )
      const now = new Date()
      const recent = await tx.emailOwnershipCode.findFirst({
        where: {
          email: input.email,
          createdAt: { gt: new Date(now.getTime() - PASSWORD_RESET_RESEND_SECONDS * 1000) },
        },
      })
      if (recent) return false
      await tx.emailOwnershipCode.updateMany({
        where: { email: input.email, consumedAt: null },
        data: { consumedAt: now },
      })
      await tx.emailOwnershipCode.create({ data: input })
      return true
    })
  }

  verify(input: VerifyEmailOwnershipCode): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const lockKey = `password-reset:${input.email}`
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`,
      )
      const now = new Date()
      const stored = await tx.emailOwnershipCode.findFirst({
        where: { email: input.email, consumedAt: null, expiresAt: { gt: now } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      })
      if (!stored || stored.attempts >= PASSWORD_RESET_CODE_MAX_ATTEMPTS) return false
      const expected = Buffer.from(stored.codeHash)
      const received = Buffer.from(input.codeHash)
      if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
        await tx.emailOwnershipCode.update({
          where: { id: stored.id },
          data: {
            attempts: { increment: 1 },
            ...(stored.attempts + 1 >= PASSWORD_RESET_CODE_MAX_ATTEMPTS ? { consumedAt: now } : {}),
          },
        })
        return false
      }
      if (input.consume) {
        await tx.emailOwnershipCode.update({ where: { id: stored.id }, data: { consumedAt: now } })
      }
      return true
    })
  }
}
