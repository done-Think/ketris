import { InvalidPasswordResetTokenError } from '../../domain/errors'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { PasswordResetTokenService } from '../ports/password-reset-token.port'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface ResetPasswordInput {
  email: string
  password: string
  resetToken: string
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordResetTokenService: PasswordResetTokenService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) return

    const resetTokenUserId = await this.passwordResetTokenService.verify(input.resetToken)

    if (resetTokenUserId !== user.id) {
      throw new InvalidPasswordResetTokenError()
    }

    const senhaHash = await this.passwordHasher.hash(input.password)

    await this.userRepository.update(user.id, { senhaHash })
    await this.refreshTokenRepository.revokeAllForUser(user.id)
  }
}
