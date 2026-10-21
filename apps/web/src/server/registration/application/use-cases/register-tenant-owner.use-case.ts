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

import {
  accountTypeForProfile,
  SELF_REGISTERED_TENANT_STATUS,
  type TenantOwnerProfile,
} from '../../domain/tenant-owner-profile'
import type { RegistrationRepository } from '../ports/registration-repository.port'

export interface RegisterTenantOwnerInput {
  profile: TenantOwnerProfile
  fullName: string
  companyName?: string
  email: string
  password: string
}

export interface RegisterTenantOwnerOutput {
  user: AuthenticatedUser
  accessToken: string
  refreshToken: string
}

export class RegisterTenantOwnerUseCase {
  constructor(
    private readonly registrationRepository: RegistrationRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: RegisterTenantOwnerInput): Promise<RegisterTenantOwnerOutput> {
    const existing = await this.userRepository.findByEmail(input.email)

    if (existing) {
      throw new EmailAlreadyInUseError()
    }

    const senhaHash = await this.passwordHasher.hash(input.password)

    const { user } = await this.registrationRepository.createTenantWithAdmin({
      tenantName: input.companyName ?? input.fullName,
      adminName: input.fullName,
      email: input.email,
      senhaHash,
      accountType: accountTypeForProfile(input.profile),
      status: SELF_REGISTERED_TENANT_STATUS,
    })

    const authenticatedUser = toAuthenticatedUser(user)
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
