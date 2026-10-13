import { prisma } from '@server/db/prisma'

import type {
  NewPasswordResetCode,
  PasswordResetCodeRepository,
  StoredPasswordResetCode,
} from '../application/ports/password-reset-code-repository.port'

export class PrismaPasswordResetCodeRepository implements PasswordResetCodeRepository {
  async create(input: NewPasswordResetCode): Promise<void> {
    await prisma.passwordResetCode.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
      },
    })
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    await prisma.passwordResetCode.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    })
  }

  async findLatestActiveByUserId(userId: string): Promise<StoredPasswordResetCode | null> {
    const code = await prisma.passwordResetCode.findFirst({
      where: { userId, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (!code) return null

    return {
      id: code.id,
      userId: code.userId,
      codeHash: code.codeHash,
      attempts: code.attempts,
      expiresAt: code.expiresAt,
    }
  }

  async incrementAttempts(id: string): Promise<void> {
    await prisma.passwordResetCode.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    })
  }

  async consume(id: string): Promise<void> {
    await prisma.passwordResetCode.update({ where: { id }, data: { consumedAt: new Date() } })
  }
}
