import { prisma } from '@server/db/prisma'

import type {
  NewRefreshToken,
  RefreshTokenRepository,
  RefreshTokenRotation,
  RefreshTokenAccountState,
  StoredRefreshToken,
} from '../application/ports/refresh-token-repository.port'

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  async rotate(input: RefreshTokenRotation): Promise<boolean> {
    const { previous, replacement } = input
    if (replacement.userId !== previous.userId || replacement.tenantId !== previous.tenantId)
      return false

    return prisma.$transaction(async (transaction) => {
      const [account] = await transaction.$queryRaw<RefreshTokenAccountState[]>`
        SELECT "active" AS "active", "sessionVersion" AS "sessionVersion"
        FROM "users" WHERE "id" = ${previous.userId} AND "tenantId" = ${previous.tenantId}
        FOR UPDATE
      `
      if (!account?.active || account.sessionVersion !== input.expectedSessionVersion) return false
      const now = new Date()
      const claimed = await transaction.refreshToken.updateMany({
        where: {
          id: previous.id,
          userId: previous.userId,
          tenantId: previous.tenantId,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      })
      if (claimed.count !== 1) return false
      await transaction.refreshToken.create({ data: replacement })
      return true
    })
  }

  async create(input: NewRefreshToken): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    })
  }

  async findValidByTokenHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    const refreshToken = await prisma.refreshToken.findUnique({ where: { tokenHash } })

    if (!refreshToken) return null
    if (refreshToken.revokedAt) return null
    if (refreshToken.expiresAt.getTime() < Date.now()) return null

    return {
      id: refreshToken.id,
      userId: refreshToken.userId,
      tenantId: refreshToken.tenantId,
    }
  }

  async revokeById(id: string): Promise<void> {
    await prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } })
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
}
