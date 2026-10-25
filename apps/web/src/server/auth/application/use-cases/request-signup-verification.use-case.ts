import type { Mailer } from '@server/shared/email/mailer.port'

import { emailVerificationExpiryDate } from '../../domain/email-verification'
import { EmailDeliveryFailedError, EmailVerificationRateLimitError } from '../../domain/errors'
import { generatePasswordResetCode, hashPasswordResetCode } from '../../domain/password-reset-code'
import type { RequestSignupVerificationInput } from '../../types/email-verification'
import { buildEmailVerificationEmail } from '../password-reset-email'
import type { EmailVerificationRepository } from '../ports/email-verification-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export class RequestSignupVerificationUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly codes: EmailVerificationRepository,
    private readonly mailer: Mailer,
  ) {}

  async execute(input: RequestSignupVerificationInput): Promise<void> {
    const user = await this.users.findByEmail(input.email, input.tenantId)
    if (
      !user ||
      user.emailVerifiedAt !== null ||
      !user.ativo ||
      user.tenantStatus === 'SUSPENDED' ||
      user.tenantStatus === 'CANCELED'
    )
      return
    const code = generatePasswordResetCode()
    const stored = await this.codes.replace({
      userId: user.id,
      tenantId: user.tenantId,
      targetEmail: user.email,
      purpose: 'SIGNUP',
      codeHash: hashPasswordResetCode(code),
      expiresAt: emailVerificationExpiryDate(),
    })
    if (!stored) throw new EmailVerificationRateLimitError()
    try {
      await this.mailer.send({
        to: user.email,
        ...(await buildEmailVerificationEmail(code, input.locale, 'SIGNUP')),
      })
    } catch {
      throw new EmailDeliveryFailedError()
    }
  }
}
