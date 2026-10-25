import { recordUserAudit } from './user-audit'
import { prisma } from '@server/db/prisma'

import type { PasswordResetAccountRepository } from '../application/ports/password-reset-account-repository.port'
import type { ResetAccountPassword } from '../types/password-reset'

export class PrismaPasswordResetAccountRepository implements PasswordResetAccountRepository {
  resetPassword(input: ResetAccountPassword): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const changed = await tx.usuario.updateMany({
        where: {
          id: input.userId,
          tenantId: input.tenantId,
          email: input.email,
          versaoSessao: input.sessionVersion,
        },
        data: { senhaHash: input.passwordHash, versaoSessao: { increment: 1 } },
      })
      if (changed.count !== 1) return false
      await tx.refreshToken.updateMany({
        where: { userId: input.userId, tenantId: input.tenantId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      await recordUserAudit(tx, {
        userId: input.userId,
        tenantId: input.tenantId,
        action: 'UPDATED',
        actor: { kind: 'USER', id: input.userId },
        changedFields: ['password'],
      })
      return true
    })
  }
}
