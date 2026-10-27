import { prisma } from '@server/db/prisma'
import type { PlatformAdmin } from '../types/platform-admin'

import type { PlatformRefreshTokenRepository } from '../application/ports/platform-refresh-token-repository.port'
import type {
  NewPlatformRefreshToken,
  PlatformRefreshTokenRotation,
  StoredPlatformRefreshToken,
} from '../types/platform-refresh-token-repository'

export class PrismaPlatformRefreshTokenRepository implements PlatformRefreshTokenRepository {
  async rotate(input: PlatformRefreshTokenRotation): Promise<boolean> {
    const { previous, replacement } = input
    if (replacement.platformAdminId !== previous.platformAdminId) return false

    return prisma.$transaction(async (transaction) => {
      const [admin] = await transaction.$queryRaw<Pick<PlatformAdmin, 'id'>[]>`
        SELECT "id" FROM "platform_admins"
        WHERE "id" = ${previous.platformAdminId} AND "ativo" = true
        FOR UPDATE
      `
      if (!admin) return false
      const now = new Date()
      const claimed = await transaction.platformAdminRefreshToken.updateMany({
        where: {
          id: previous.id,
          platformAdminId: previous.platformAdminId,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      })
      if (claimed.count !== 1) return false
      await transaction.platformAdminRefreshToken.create({ data: replacement })
      return true
    })
  }

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
    await prisma.platformAdminRefreshToken.updateMany({
      where: { id, revokedAt: null },
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
