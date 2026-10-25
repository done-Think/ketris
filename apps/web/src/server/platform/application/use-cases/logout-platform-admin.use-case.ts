import { hashPlatformRefreshToken } from '../../domain/refresh-token'
import type { PlatformRefreshTokenRepository } from '../ports/platform-refresh-token-repository.port'

export class LogoutPlatformAdminUseCase {
  constructor(private readonly refreshTokens: PlatformRefreshTokenRepository) {}

  async execute(refreshToken: string): Promise<void> {
    const stored = await this.refreshTokens.findValidByTokenHash(
      hashPlatformRefreshToken(refreshToken),
    )
    if (stored) await this.refreshTokens.revokeById(stored.id)
  }
}
