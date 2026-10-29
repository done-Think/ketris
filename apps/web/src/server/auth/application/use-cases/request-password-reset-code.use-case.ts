import type { Mailer } from '@server/shared/email/mailer.port'
import { normalizeEmail } from '@server/shared/normalize-email'

import type { RequestPasswordResetCodeInput } from '../../types/use-case-inputs'
import {
  generatePasswordResetCode,
  hashPasswordResetCode,
  passwordResetCodeExpiryDate,
} from '../../domain/password-reset-code'
import { buildPasswordResetEmail } from '../password-reset-email'
import type { EmailOwnershipCodeRepository } from '../ports/email-ownership-code-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export class RequestPasswordResetCodeUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly codes: EmailOwnershipCodeRepository,
    private readonly mailer: Mailer,
  ) {}

  async execute(input: RequestPasswordResetCodeInput): Promise<void> {
    const email = normalizeEmail(input.email)
    const accounts = await this.users.findManyByEmail(email)
    if (accounts.length === 0) return
    const code = generatePasswordResetCode()
    const stored = await this.codes.replace({
      email,
      codeHash: hashPasswordResetCode(code),
      expiresAt: passwordResetCodeExpiryDate(),
    })
    if (!stored) return
    try {
      await this.mailer.send({ to: email, ...(await buildPasswordResetEmail(code, input.locale)) })
    } catch {
      console.error('[auth] Password recovery email delivery failed.')
    }
  }
}
