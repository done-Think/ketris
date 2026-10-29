import { InvalidEmailVerificationCodeError } from '../../domain/errors'
import type {
  ConfirmSignupVerificationInput,
  ConfirmSignupVerificationOutput,
} from '../../types/email-verification'
import { issueAuthenticatedSession } from '../issue-authenticated-session'
import { verifyEmailCode } from '../verify-email-code'
import type { EmailVerificationRepository } from '../ports/email-verification-repository.port'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { TokenService } from '../ports/token-service.port'
import type { UserRepository } from '../ports/user-repository.port'

export class ConfirmSignupVerificationUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly codes: EmailVerificationRepository,
    private readonly tokens: TokenService,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(input: ConfirmSignupVerificationInput): Promise<ConfirmSignupVerificationOutput> {
    const user = await this.users.findByEmail(input.email, input.tenantId)
    if (!user || user.emailVerifiedAt !== null) throw new InvalidEmailVerificationCodeError()
    const record = await verifyEmailCode(
      await this.codes.findLatest(user.id, user.tenantId, 'SIGNUP'),
      input.code,
      this.codes,
    )
    if (record.targetEmail !== user.email) throw new InvalidEmailVerificationCodeError()
    const confirmed = await this.codes.confirm({
      id: record.id,
      userId: user.id,
      tenantId: user.tenantId,
      currentEmail: user.email,
      targetEmail: user.email,
      purpose: 'SIGNUP',
      codeHash: record.codeHash,
    })
    if (!confirmed) throw new InvalidEmailVerificationCodeError()
    const verified = await this.users.findById(user.id)
    if (!verified) throw new InvalidEmailVerificationCodeError()
    if (verified.role === 'AGENT' && verified.membershipApprovedAt === null)
      return { outcome: 'PENDING_APPROVAL', email: verified.email }
    return {
      outcome: 'REGISTERED',
      ...(await issueAuthenticatedSession(verified, this.tokens, this.refreshTokens)),
    }
  }
}
