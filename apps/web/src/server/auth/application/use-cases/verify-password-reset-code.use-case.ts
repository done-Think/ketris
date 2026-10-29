import { normalizeEmail } from '@server/shared/normalize-email'

import type { VerifyPasswordResetCodeOutput } from '../../types/use-case-outputs'
import type { VerifyPasswordResetCodeInput } from '../../types/use-case-inputs'
import { hashPasswordResetCode } from '../../domain/password-reset-code'
import { InvalidPasswordResetCodeError } from '../../domain/errors'
import type { EmailOwnershipCodeRepository } from '../ports/email-ownership-code-repository.port'
import type { PasswordResetTokenService } from '../ports/password-reset-token.port'
import type { UserRepository } from '../ports/user-repository.port'

export class VerifyPasswordResetCodeUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly codes: EmailOwnershipCodeRepository,
    private readonly tokens: PasswordResetTokenService,
  ) {}

  async execute(input: VerifyPasswordResetCodeInput): Promise<VerifyPasswordResetCodeOutput> {
    const email = normalizeEmail(input.email)
    const proof = { email, codeHash: hashPasswordResetCode(input.code) }
    if (!(await this.codes.verify({ ...proof, consume: false })))
      throw new InvalidPasswordResetCodeError()
    const accounts = await this.users.findManyByEmail(email)
    if (accounts.length === 0) throw new InvalidPasswordResetCodeError()
    if (!input.tenantId && accounts.length > 1) {
      return {
        outcome: 'SELECT_TENANT',
        tenants: accounts.map((user) => ({
          id: user.tenantId,
          name: user.tenantName ?? user.tenantId,
          slug: user.tenantSlug ?? '',
        })),
      }
    }
    const selected = input.tenantId
      ? accounts.find((user) => user.tenantId === input.tenantId)
      : accounts[0]
    if (!selected || !(await this.codes.verify({ ...proof, consume: true })))
      throw new InvalidPasswordResetCodeError()
    const resetToken = await this.tokens.issue(selected.id, selected.sessionVersion ?? 0)
    return { resetToken }
  }
}
