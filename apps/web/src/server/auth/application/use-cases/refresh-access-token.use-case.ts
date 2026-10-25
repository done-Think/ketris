import type { RefreshAccessTokenOutput } from '../../types/use-case-outputs'
import type { RefreshAccessTokenInput } from '../../types/use-case-inputs'
import { InvalidRefreshTokenError } from '../../domain/errors'
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from '../../domain/refresh-token'
import { toAuthenticatedUser } from '../../domain/user.entity'
import { assertUserCanAuthenticate } from '../../domain/user-access-policy'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { TokenService } from '../ports/token-service.port'
import type { UserRepository } from '../ports/user-repository.port'

export class RefreshAccessTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: RefreshAccessTokenInput): Promise<RefreshAccessTokenOutput> {
    const tokenHash = hashRefreshToken(input.refreshToken)
    const stored = await this.refreshTokenRepository.findValidByTokenHash(tokenHash)

    if (!stored) {
      throw new InvalidRefreshTokenError()
    }

    const user = await this.userRepository.findById(stored.userId)

    if (!user || user.tenantId !== stored.tenantId) {
      throw new InvalidRefreshTokenError()
    }
    try {
      assertUserCanAuthenticate(user)
    } catch {
      throw new InvalidRefreshTokenError()
    }

    const authenticatedUser = toAuthenticatedUser(user)
    const accessToken = await this.tokenService.sign(authenticatedUser)
    const newRefreshToken = generateRefreshToken()

    const rotated = await this.refreshTokenRepository.rotate({
      previous: stored,
      expectedSessionVersion: user.sessionVersion ?? 0,
      replacement: {
        userId: authenticatedUser.id,
        tenantId: authenticatedUser.tenantId,
        tokenHash: hashRefreshToken(newRefreshToken),
        expiresAt: refreshTokenExpiryDate(),
      },
    })
    if (!rotated) throw new InvalidRefreshTokenError()

    return { accessToken, refreshToken: newRefreshToken }
  }
}
