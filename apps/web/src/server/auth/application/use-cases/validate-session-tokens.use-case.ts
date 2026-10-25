import { UnauthorizedError } from '@server/shared/errors'

import { hashRefreshToken } from '../../domain/refresh-token'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { AccessTokenPayload, TokenService } from '../ports/token-service.port'

export class ValidateSessionTokensUseCase {
  constructor(
    private readonly tokens: TokenService,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(accessToken: string, refreshToken: string): Promise<AccessTokenPayload> {
    const payload = await this.tokens.verify(accessToken)
    const stored = await this.refreshTokens.findValidByTokenHash(hashRefreshToken(refreshToken))

    if (!stored || stored.userId !== payload.sub || stored.tenantId !== payload.tenantId) {
      throw new UnauthorizedError()
    }

    return payload
  }
}
