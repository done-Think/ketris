import { ForbiddenError } from '@server/shared/errors'
import type { Mailer } from '@server/shared/email/mailer.port'
import { normalizeEmail } from '@server/shared/normalize-email'

import { isAgencyManager } from '../../domain/roles'
import { emailVerificationExpiryDate } from '../../domain/email-verification'
import {
  EmailAlreadyInUseError,
  EmailVerificationRateLimitError,
  UserNotFoundError,
} from '../../domain/errors'
import { generatePasswordResetCode, hashPasswordResetCode } from '../../domain/password-reset-code'
import { assertUserCanAuthenticate } from '../../domain/user-access-policy'
import type { RequestEmailChangeInput } from '../../types/email-verification'
import { buildEmailVerificationEmail } from '../password-reset-email'
import type { EmailVerificationRepository } from '../ports/email-verification-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export class RequestEmailChangeUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly codes: EmailVerificationRepository,
    private readonly mailer: Mailer,
  ) {}

  async execute(input: RequestEmailChangeInput): Promise<void> {
    const targetUserId = input.targetUserId ?? input.actorId
    const isSelf = targetUserId === input.actorId
    if (!isSelf && (!input.actorRole || !isAgencyManager(input.actorRole))) {
      throw new ForbiddenError(
        'Apenas a gestão da imobiliária pode solicitar alterações de e-mail para outros usuários.',
      )
    }
    const user = await this.users.findById(targetUserId)
    if (!user || user.tenantId !== input.actorTenantId) throw new UserNotFoundError()
    if (isSelf) assertUserCanAuthenticate(user)
    const targetEmail = normalizeEmail(input.email)
    if (user.email === targetEmail) return
    const existing = await this.users.findByEmail(targetEmail, user.tenantId)
    if (existing && existing.id !== user.id) throw new EmailAlreadyInUseError()
    const code = generatePasswordResetCode()
    const stored = await this.codes.replace({
      userId: user.id,
      tenantId: user.tenantId,
      targetEmail,
      purpose: 'EMAIL_CHANGE',
      codeHash: hashPasswordResetCode(code),
      expiresAt: emailVerificationExpiryDate(),
    })
    if (!stored) throw new EmailVerificationRateLimitError()
    await this.mailer.send({
      to: targetEmail,
      ...(await buildEmailVerificationEmail(code, input.locale, 'EMAIL_CHANGE', stored.id)),
    })
  }
}
