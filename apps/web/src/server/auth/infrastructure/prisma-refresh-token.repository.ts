import { prisma } from '@server/db/prisma'

import type {
  NewRefreshToken,
  RefreshTokenRepository,
  StoredRefreshToken,
} from '../application/ports/refresh-token-repository.port'

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
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
