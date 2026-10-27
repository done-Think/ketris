import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'

import { InvalidPlatformCredentialsError } from '../../domain/errors'
import { toAuthenticatedPlatformAdmin } from '../../domain/platform-admin.entity'
import {
  generatePlatformRefreshToken,
  hashPlatformRefreshToken,
  platformRefreshTokenExpiryDate,
} from '../../domain/refresh-token'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type { PlatformRefreshTokenRepository } from '../ports/platform-refresh-token-repository.port'
import type { PlatformTokenService } from '../ports/platform-token-service.port'
import type { LoginPlatformAdminInput, LoginPlatformAdminOutput } from '../../types/use-case-inputs'

export class LoginPlatformAdminUseCase {
  constructor(
    private readonly platformAdminRepository: PlatformAdminRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: PlatformTokenService,
    private readonly refreshTokenRepository: PlatformRefreshTokenRepository,
  ) {}

  async execute(input: LoginPlatformAdminInput): Promise<LoginPlatformAdminOutput> {
    const admin = await this.platformAdminRepository.findByEmail(input.email)

    if (!admin || !admin.ativo) {
      throw new InvalidPlatformCredentialsError()
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, admin.senhaHash)

    if (!passwordMatches) {
      throw new InvalidPlatformCredentialsError()
    }

    const accessedAt = new Date()
    await this.platformAdminRepository.recordAccess(admin.id, accessedAt)
    const authenticatedAdmin = toAuthenticatedPlatformAdmin({
      ...admin,
      ultimoAcessoEm: accessedAt,
    })
    const accessToken = await this.tokenService.sign(authenticatedAdmin)

    const refreshToken = generatePlatformRefreshToken()

    await this.refreshTokenRepository.create({
      platformAdminId: authenticatedAdmin.id,
      tokenHash: hashPlatformRefreshToken(refreshToken),
      expiresAt: platformRefreshTokenExpiryDate(),
    })

    return { admin: authenticatedAdmin, accessToken, refreshToken }
  }
}
