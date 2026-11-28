import type { LogoutInput } from '../../types/use-case-inputs'
import { REFRESH_TOKEN_ROTATION_GRACE_SECONDS, hashRefreshToken } from '../../domain/refresh-token'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async execute(input: LogoutInput): Promise<void> {
    const tokenHash = hashRefreshToken(input.refreshToken)
    const stored = await this.refreshTokenRepository.findValidByTokenHash(tokenHash)

    if (stored) {
      await this.refreshTokenRepository.revokeById(stored.id)
      return
    }

    const rotated = await this.refreshTokenRepository.findRecentlyRotatedByTokenHash(
      tokenHash,
      REFRESH_TOKEN_ROTATION_GRACE_SECONDS,
    )
    if (rotated?.rotatedTo) await this.refreshTokenRepository.revokeById(rotated.rotatedTo)
  }
}
