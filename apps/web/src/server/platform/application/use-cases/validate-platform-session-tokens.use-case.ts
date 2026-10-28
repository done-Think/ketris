import { UnauthorizedError } from '@server/shared/errors'

import { hashPlatformRefreshToken } from '../../domain/refresh-token'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type { PlatformRefreshTokenRepository } from '../ports/platform-refresh-token-repository.port'
import type { PlatformTokenService } from '../ports/platform-token-service.port'
import type { PlatformAccessTokenPayload } from '../../types/platform-token-service'

export class ValidatePlatformSessionTokensUseCase {
  constructor(
    private readonly tokens: PlatformTokenService,
    private readonly admins: PlatformAdminRepository,
    private readonly refreshTokens: PlatformRefreshTokenRepository,
  ) {}

  async execute(accessToken: string, refreshToken: string): Promise<PlatformAccessTokenPayload> {
    const payload = await this.tokens.verify(accessToken)
    const admin = await this.admins.findById(payload.sub)
    if (!admin?.active) throw new UnauthorizedError()

    const stored = await this.refreshTokens.findValidByTokenHash(
      hashPlatformRefreshToken(refreshToken),
    )
    if (!stored || stored.platformAdminId !== payload.sub) throw new UnauthorizedError()

    return payload
  }
}
