import type { PasswordHasher } from '../ports/password-hasher.port'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface ChangeOwnPasswordInput {
  userId: string
  password: string
}

export class ChangeOwnPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: ChangeOwnPasswordInput): Promise<void> {
    const senhaHash = await this.passwordHasher.hash(input.password)

    await this.userRepository.update(input.userId, { senhaHash })
    await this.refreshTokenRepository.revokeAllForUser(input.userId)
  }
}
