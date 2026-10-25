import type { LogoutInput } from '../../types/use-case-inputs'
import { hashRefreshToken } from '../../domain/refresh-token'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'

export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async execute(input: LogoutInput): Promise<void> {
    const tokenHash = hashRefreshToken(input.refreshToken)
    const stored = await this.refreshTokenRepository.findValidByTokenHash(tokenHash)

    if (!stored) return

    await this.refreshTokenRepository.revokeById(stored.id)
  }
}
