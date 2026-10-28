import type { LoginOutput } from '../../types/use-case-outputs'
import type { LoginInput } from '../../types/use-case-inputs'
import { InvalidCredentialsError, TenantSelectionRequiredError } from '../../domain/errors'
import { INVALID_CREDENTIAL_PASSWORD_HASH } from '../../domain/credential-timing'
import { issueAuthenticatedSession } from '../issue-authenticated-session'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { TokenService } from '../ports/token-service.port'
import type { UserRepository } from '../ports/user-repository.port'

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const candidates = await this.userRepository.findManyByEmail(input.email)
    if (candidates.length === 0) {
      await this.passwordHasher.compare(input.password, INVALID_CREDENTIAL_PASSWORD_HASH)
      throw new InvalidCredentialsError()
    }
    const matches = await Promise.all(
      candidates.map(async (user) => ({
        user,
        matches: await this.passwordHasher.compare(input.password, user.passwordHash),
      })),
    )
    const matchingUsers = matches.filter((entry) => entry.matches).map((entry) => entry.user)
    if (matchingUsers.length === 0) {
      throw new InvalidCredentialsError()
    }
    if (matchingUsers.length > 1 && !input.tenantId) {
      throw new TenantSelectionRequiredError(
        matchingUsers.map((user) => ({
          id: user.tenantId,
          name: user.tenantName ?? user.tenantId,
          slug: user.tenantSlug ?? user.tenantId,
        })),
      )
    }
    const user = input.tenantId
      ? matchingUsers.find((candidate) => candidate.tenantId === input.tenantId)
      : matchingUsers[0]
    if (!user) throw new InvalidCredentialsError()

    return issueAuthenticatedSession(user, this.tokenService, this.refreshTokenRepository)
  }
}
