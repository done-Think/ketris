import {
  PASSWORD_RESET_CODE_MAX_ATTEMPTS,
  hashPasswordResetCode,
} from '../../domain/password-reset-code'
import { InvalidPasswordResetCodeError } from '../../domain/errors'
import type { PasswordResetCodeRepository } from '../ports/password-reset-code-repository.port'
import type { PasswordResetTokenService } from '../ports/password-reset-token.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface VerifyPasswordResetCodeInput {
  email: string
  code: string
}

export interface VerifyPasswordResetCodeOutput {
  resetToken: string
}

export class VerifyPasswordResetCodeUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetCodeRepository: PasswordResetCodeRepository,
    private readonly passwordResetTokenService: PasswordResetTokenService,
  ) {}

  async execute(input: VerifyPasswordResetCodeInput): Promise<VerifyPasswordResetCodeOutput> {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) {
      throw new InvalidPasswordResetCodeError()
    }

    const storedCode = await this.passwordResetCodeRepository.findLatestActiveByUserId(user.id)

    if (!storedCode) {
      throw new InvalidPasswordResetCodeError()
    }

    if (storedCode.attempts >= PASSWORD_RESET_CODE_MAX_ATTEMPTS) {
      await this.passwordResetCodeRepository.consume(storedCode.id)
      throw new InvalidPasswordResetCodeError()
    }

    const codeMatches = storedCode.codeHash === hashPasswordResetCode(input.code)

    if (!codeMatches) {
      await this.passwordResetCodeRepository.incrementAttempts(storedCode.id)
      throw new InvalidPasswordResetCodeError()
    }

    await this.passwordResetCodeRepository.consume(storedCode.id)

    const resetToken = await this.passwordResetTokenService.issue(user.id)

    return { resetToken }
  }
}
