import type { TokenService } from '../application/ports/token-service.port'
import type { ValidateAccessTokenUseCase } from '../application/use-cases/validate-access-token.use-case'
import type { AuthenticatedUser } from '../domain/user.entity'

export class ValidatedTokenService implements TokenService {
  constructor(
    private readonly tokens: TokenService,
    private readonly validateAccessToken: ValidateAccessTokenUseCase,
  ) {}

  sign(user: AuthenticatedUser) {
    return this.tokens.sign(user)
  }

  verify(token: string) {
    return this.validateAccessToken.execute(token)
  }
}
