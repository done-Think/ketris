import { prisma } from '@server/db/prisma'

import type {
  NewPlatformRefreshToken,
  PlatformRefreshTokenRepository,
  StoredPlatformRefreshToken,
} from '../application/ports/platform-refresh-token-repository.port'

export class PrismaPlatformRefreshTokenRepository implements PlatformRefreshTokenRepository {
  async create(input: NewPlatformRefreshToken): Promise<void> {
    await prisma.platformAdminRefreshToken.create({
      data: {
        platformAdminId: input.platformAdminId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    })
  }

  async findValidByTokenHash(tokenHash: string): Promise<StoredPlatformRefreshToken | null> {
    const refreshToken = await prisma.platformAdminRefreshToken.findUnique({
      where: { tokenHash },
    })

    if (!refreshToken) return null
    if (refreshToken.revokedAt) return null
    if (refreshToken.expiresAt.getTime() < Date.now()) return null

    return {
      id: refreshToken.id,
      platformAdminId: refreshToken.platformAdminId,
    }
  }

  async revokeById(id: string): Promise<void> {
    await prisma.platformAdminRefreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    })
  }

  async revokeAllForPlatformAdmin(platformAdminId: string): Promise<void> {
    await prisma.platformAdminRefreshToken.updateMany({
      where: { platformAdminId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
}
