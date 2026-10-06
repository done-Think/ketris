import {
  generatePasswordResetCode,
  hashPasswordResetCode,
  passwordResetCodeExpiryDate,
} from '../../domain/password-reset-code'
import { buildPasswordResetEmail } from '../password-reset-email'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { Mailer } from '@server/shared/email/mailer.port'
import type { PasswordResetCodeRepository } from '../ports/password-reset-code-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface RequestPasswordResetCodeInput {
  email: string
  locale: AppLocale
}

export class RequestPasswordResetCodeUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetCodeRepository: PasswordResetCodeRepository,
    private readonly mailer: Mailer,
  ) {}

  async execute(input: RequestPasswordResetCodeInput): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) return

    const code = generatePasswordResetCode()

    await this.passwordResetCodeRepository.invalidateAllForUser(user.id)
    await this.passwordResetCodeRepository.create({
      userId: user.id,
      tenantId: user.tenantId,
      codeHash: hashPasswordResetCode(code),
      expiresAt: passwordResetCodeExpiryDate(),
    })

    await this.mailer.send({
      to: user.email,
      ...(await buildPasswordResetEmail(code, input.locale)),
    })
  }
}
