import { InvalidRefreshTokenError } from '../../domain/errors'
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from '../../domain/refresh-token'
import { toAuthenticatedUser } from '../../domain/user.entity'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { TokenService } from '../ports/token-service.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface RefreshAccessTokenInput {
  refreshToken: string
}

export interface RefreshAccessTokenOutput {
  accessToken: string
  refreshToken: string
}

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

    if (!user || !user.ativo) {
      throw new InvalidRefreshTokenError()
    }

    await this.refreshTokenRepository.revokeById(stored.id)

    const authenticatedUser = toAuthenticatedUser(user)
    const accessToken = await this.tokenService.sign(authenticatedUser)
    const newRefreshToken = generateRefreshToken()

    await this.refreshTokenRepository.create({
      userId: authenticatedUser.id,
      tenantId: authenticatedUser.tenantId,
      tokenHash: hashRefreshToken(newRefreshToken),
      expiresAt: refreshTokenExpiryDate(),
    })

    return { accessToken, refreshToken: newRefreshToken }
  }
}
