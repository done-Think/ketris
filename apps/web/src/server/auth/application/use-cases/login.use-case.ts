import { InvalidCredentialsError } from '../../domain/errors'
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from '../../domain/refresh-token'
import { toAuthenticatedUser, type AuthenticatedUser } from '../../domain/user.entity'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { TokenService } from '../ports/token-service.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface LoginInput {
  email: string
  password: string
}

export interface LoginOutput {
  user: AuthenticatedUser
  accessToken: string
  refreshToken: string
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) {
      throw new InvalidCredentialsError()
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, user.senhaHash)

    if (!passwordMatches) {
      throw new InvalidCredentialsError()
    }

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
