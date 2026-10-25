import { Prisma } from '@prisma/client'

import { recordUserAudit } from './user-audit'
import { prisma } from '@server/db/prisma'

import type { EmailVerificationRepository } from '../application/ports/email-verification-repository.port'
import { EmailAlreadyInUseError } from '../domain/errors'
import {
  EMAIL_VERIFICATION_MAX_ATTEMPTS,
  EMAIL_VERIFICATION_RESEND_SECONDS,
} from '../domain/email-verification'
import type {
  ConfirmEmailCodeInput,
  EmailVerificationPurpose,
  EmailVerificationRecord,
  NewEmailVerificationCode,
} from '../types/email-verification'

export class PrismaEmailVerificationRepository implements EmailVerificationRepository {
  findLatest(userId: string, tenantId: string, purpose: EmailVerificationPurpose) {
    return prisma.emailVerificationCode.findFirst({
      where: { userId, tenantId, purpose },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })
  }

  findById(id: string) {
    return prisma.emailVerificationCode.findUnique({ where: { id } })
  }

  replace(input: NewEmailVerificationCode): Promise<EmailVerificationRecord | null> {
    return prisma.$transaction(async (tx) => {
      const lockKey = [input.userId, input.tenantId, input.purpose].join(':')
      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`,
      )
      const now = new Date()
      const recent = await tx.emailVerificationCode.findFirst({
        where: {
          userId: input.userId,
          tenantId: input.tenantId,
          purpose: input.purpose,
          createdAt: { gt: new Date(now.getTime() - EMAIL_VERIFICATION_RESEND_SECONDS * 1000) },
        },
      })
      if (recent) return null
      await tx.emailVerificationCode.updateMany({
        where: {
          userId: input.userId,
          tenantId: input.tenantId,
          purpose: input.purpose,
          consumedAt: null,
        },
        data: { consumedAt: now },
      })
      return tx.emailVerificationCode.create({ data: input })
    })
  }

  async incrementAttempts(id: string, userId: string, tenantId: string): Promise<void> {
    await prisma.emailVerificationCode.updateMany({
      where: {
        id,
        userId,
        tenantId,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: EMAIL_VERIFICATION_MAX_ATTEMPTS },
      },
      data: { attempts: { increment: 1 } },
    })
  }

  async confirm(input: ConfirmEmailCodeInput): Promise<boolean> {
    try {
      return await prisma.$transaction(async (tx) => {
        const now = new Date()
        const user = await tx.usuario.findFirst({
          where: { id: input.userId, tenantId: input.tenantId, email: input.currentEmail },
        })
        if (!user) return false
        const claimed = await tx.emailVerificationCode.updateMany({
          where: {
            id: input.id,
            userId: input.userId,
            tenantId: input.tenantId,
            targetEmail: input.targetEmail,
            purpose: input.purpose,
            codeHash: input.codeHash,
            consumedAt: null,
            expiresAt: { gt: now },
            attempts: { lt: EMAIL_VERIFICATION_MAX_ATTEMPTS },
          },
          data: { consumedAt: now },
        })
        if (claimed.count !== 1) return false
        await tx.usuario.update({
          where: { id: input.userId, tenantId: input.tenantId, email: input.currentEmail },
          data:
            input.purpose === 'SIGNUP'
              ? { emailVerificadoEm: now }
              : {
                  email: input.targetEmail,
                  emailVerificadoEm: now,
                  versaoSessao: { increment: 1 },
                },
        })
        if (input.purpose === 'EMAIL_CHANGE') {
          await tx.refreshToken.updateMany({
            where: { userId: input.userId, tenantId: input.tenantId, revokedAt: null },
            data: { revokedAt: now },
          })
        }
        await recordUserAudit(tx, {
          userId: input.userId,
          tenantId: input.tenantId,
          action: 'UPDATED',
          actor: { kind: 'USER', id: input.userId },
          changedFields:
            input.purpose === 'SIGNUP' ? ['emailVerified'] : ['email', 'emailVerified'],
        })
        return true
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new EmailAlreadyInUseError()
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025')
        return false
      throw error
    }
  }
}
