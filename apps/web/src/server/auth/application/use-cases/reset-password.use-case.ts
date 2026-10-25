import { normalizeEmail } from '@server/shared/normalize-email'

import type { ResetPasswordInput } from '../../types/use-case-inputs'
import { InvalidPasswordResetTokenError } from '../../domain/errors'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { PasswordResetTokenService } from '../ports/password-reset-token.port'
import type { PasswordResetAccountRepository } from '../ports/password-reset-account-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export class ResetPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly accounts: PasswordResetAccountRepository,
    private readonly tokens: PasswordResetTokenService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const claims = await this.tokens.verify(input.resetToken)
    const user = await this.users.findById(claims.userId)
    if (
      !user ||
      user.email !== normalizeEmail(input.email) ||
      (input.tenantId && user.tenantId !== input.tenantId) ||
      (user.sessionVersion ?? 0) !== claims.sessionVersion
    )
      throw new InvalidPasswordResetTokenError()
    const passwordHash = await this.hasher.hash(input.password)
    const changed = await this.accounts.resetPassword({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      sessionVersion: claims.sessionVersion,
      passwordHash,
    })
    if (!changed) throw new InvalidPasswordResetTokenError()
  }
}
