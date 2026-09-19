import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from '@server/auth/domain/refresh-token'
import { EmailAlreadyInUseError } from '@server/auth/domain/errors'
import { toAuthenticatedUser, type AuthenticatedUser } from '@server/auth/domain/user.entity'
import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'
import type { RefreshTokenRepository } from '@server/auth/application/ports/refresh-token-repository.port'
import type { TokenService } from '@server/auth/application/ports/token-service.port'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import type { TenantRepository } from '@server/platform/application/ports/tenant-repository.port'

import { RenterTenantNotConfiguredError } from '../../domain/errors'

export const RENTER_TENANT_SLUG = 'locatarios'

export interface RegisterRenterInput {
  fullName: string
  email: string
  password: string
}

export interface RegisterRenterOutput {
  user: AuthenticatedUser
  accessToken: string
  refreshToken: string
}

export class RegisterRenterUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: RegisterRenterInput): Promise<RegisterRenterOutput> {
    const renterTenant = await this.tenantRepository.findBySlug(RENTER_TENANT_SLUG)

    if (!renterTenant) {
      throw new RenterTenantNotConfiguredError()
    }

    const existing = await this.userRepository.findByEmail(input.email)

    if (existing) {
      throw new EmailAlreadyInUseError()
    }

    const senhaHash = await this.passwordHasher.hash(input.password)

    const created = await this.userRepository.create({
      tenantId: renterTenant.id,
      nome: input.fullName,
      email: input.email,
      senhaHash,
      papel: 'RENTER',
    })

    const authenticatedUser = toAuthenticatedUser(created)
    const accessToken = await this.tokenService.sign(authenticatedUser)
    const refreshToken = generateRefreshToken()

    await this.refreshTokenRepository.create({
      userId: authenticatedUser.id,
      tenantId: authenticatedUser.tenantId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiryDate(),
    })

    return { user: authenticatedUser, accessToken, refreshToken }
  }
}
