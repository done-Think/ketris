import { normalizeEmail } from '@server/shared/normalize-email'

import { InvalidEmailVerificationCodeError, UserNotFoundError } from '../../domain/errors'
import { assertUserCanAuthenticate } from '../../domain/user-access-policy'
import type { ConfirmEmailChangeInput } from '../../types/email-verification'
import { verifyEmailCode } from '../verify-email-code'
import type { EmailVerificationRepository } from '../ports/email-verification-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export class ConfirmEmailChangeUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly codes: EmailVerificationRepository,
  ) {}

  async execute(input: ConfirmEmailChangeInput): Promise<void> {
    const user = await this.users.findById(input.actorId)
    if (!user || user.tenantId !== input.actorTenantId) throw new UserNotFoundError()
    assertUserCanAuthenticate(user)
    const record = await verifyEmailCode(
      await this.codes.findLatest(user.id, user.tenantId, 'EMAIL_CHANGE'),
      input.code,
      this.codes,
    )
    const targetEmail = normalizeEmail(input.email)
    if (record.targetEmail !== targetEmail) throw new InvalidEmailVerificationCodeError()
    const changed = await this.codes.confirm({
      id: record.id,
      userId: user.id,
      tenantId: user.tenantId,
      currentEmail: user.email,
      targetEmail,
      purpose: 'EMAIL_CHANGE',
      codeHash: record.codeHash,
    })
    if (!changed) throw new InvalidEmailVerificationCodeError()
  }
}
