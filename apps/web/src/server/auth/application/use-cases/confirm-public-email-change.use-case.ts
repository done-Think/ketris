import { InvalidEmailVerificationCodeError } from '../../domain/errors'
import type { ConfirmPublicEmailChangeInput } from '../../types/public-email-change'
import type { EmailVerificationRepository } from '../ports/email-verification-repository.port'
import type { UserRepository } from '../ports/user-repository.port'
import { guardCodeAttempts } from '../consume-code-attempt'
import { verifyEmailCode } from '../verify-email-code'
import type { CodeAttemptLimiter } from '../ports/code-attempt-limiter.port'

export class ConfirmPublicEmailChangeUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly codes: EmailVerificationRepository,
    private readonly attempts: CodeAttemptLimiter,
  ) {}

  async execute(input: ConfirmPublicEmailChangeInput): Promise<void> {
    const pending = await this.codes.findById(input.requestId)
    if (!pending || pending.purpose !== 'EMAIL_CHANGE') {
      throw new InvalidEmailVerificationCodeError()
    }
    return guardCodeAttempts(
      this.attempts,
      'EMAIL_CHANGE',
      pending.targetEmail,
      InvalidEmailVerificationCodeError,
      async () => {
        const record = await verifyEmailCode(pending, input.code, this.codes)
        const user = await this.users.findById(record.userId)
        if (!user || user.tenantId !== record.tenantId)
          throw new InvalidEmailVerificationCodeError()
        const confirmed = await this.codes.confirm({
          id: record.id,
          userId: record.userId,
          tenantId: record.tenantId,
          currentEmail: user.email,
          targetEmail: record.targetEmail,
          purpose: 'EMAIL_CHANGE',
          codeHash: record.codeHash,
        })
        if (!confirmed) throw new InvalidEmailVerificationCodeError()
      },
    )
  }
}
