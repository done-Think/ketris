import { UnauthorizedError } from '@server/shared/errors'

import { assertUserCanAuthenticate } from '../../domain/user-access-policy'
import type { AccessTokenPayload, TokenService } from '../ports/token-service.port'
import type { UserRepository } from '../ports/user-repository.port'

export class ValidateAccessTokenUseCase {
  constructor(
    private readonly tokens: TokenService,
    private readonly users: UserRepository,
  ) {}

  async execute(token: string): Promise<AccessTokenPayload> {
    const payload = await this.tokens.verify(token)
    const user = await this.users.findById(payload.sub)
    if (
      !user ||
      user.tenantId !== payload.tenantId ||
      user.role !== payload.role ||
      (user.sessionVersion ?? 0) !== (payload.sessionVersion ?? 0)
    ) {
      throw new UnauthorizedError()
    }
    assertUserCanAuthenticate(user)
    return payload
  }
}
