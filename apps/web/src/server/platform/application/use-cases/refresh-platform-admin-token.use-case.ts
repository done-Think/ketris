import { InvalidPlatformRefreshTokenError } from '../../domain/errors'
import { toAuthenticatedPlatformAdmin } from '../../domain/platform-admin.entity'
import {
  generatePlatformRefreshToken,
  hashPlatformRefreshToken,
  platformRefreshTokenExpiryDate,
} from '../../domain/refresh-token'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type { PlatformRefreshTokenRepository } from '../ports/platform-refresh-token-repository.port'
import type { PlatformTokenService } from '../ports/platform-token-service.port'
import type {
  RefreshPlatformAdminTokenInput,
  RefreshPlatformAdminTokenOutput,
} from '../../types/use-case-inputs'

export class RefreshPlatformAdminTokenUseCase {
  constructor(
    private readonly platformAdminRepository: PlatformAdminRepository,
    private readonly tokenService: PlatformTokenService,
    private readonly refreshTokenRepository: PlatformRefreshTokenRepository,
  ) {}

  async execute(input: RefreshPlatformAdminTokenInput): Promise<RefreshPlatformAdminTokenOutput> {
    const tokenHash = hashPlatformRefreshToken(input.refreshToken)
    const stored = await this.refreshTokenRepository.findValidByTokenHash(tokenHash)

    if (!stored) {
      throw new InvalidPlatformRefreshTokenError()
    }

    const admin = await this.platformAdminRepository.findById(stored.platformAdminId)

    if (!admin || !admin.active) {
      throw new InvalidPlatformRefreshTokenError()
    }

    const authenticatedAdmin = toAuthenticatedPlatformAdmin(admin)
    const accessToken = await this.tokenService.sign(authenticatedAdmin)
    const newRefreshToken = generatePlatformRefreshToken()

    const rotated = await this.refreshTokenRepository.rotate({
      previous: stored,
      replacement: {
        platformAdminId: authenticatedAdmin.id,
        tokenHash: hashPlatformRefreshToken(newRefreshToken),
        expiresAt: platformRefreshTokenExpiryDate(),
      },
    })
    if (!rotated) throw new InvalidPlatformRefreshTokenError()

    return { accessToken, refreshToken: newRefreshToken }
  }
}
