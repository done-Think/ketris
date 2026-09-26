import type { PasswordHasher } from '../ports/password-hasher.port'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface ResetPasswordInput {
  email: string
  password: string
}

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email)

    if (!user) return

    const senhaHash = await this.passwordHasher.hash(input.password)

    await this.userRepository.update(user.id, { senhaHash })
    await this.refreshTokenRepository.revokeAllForUser(user.id)
  }
}
