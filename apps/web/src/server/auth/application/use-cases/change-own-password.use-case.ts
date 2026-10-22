import { InvalidCurrentPasswordError, UserNotFoundError } from '../../domain/errors'
import type { PasswordHasher } from '../ports/password-hasher.port'
import type { RefreshTokenRepository } from '../ports/refresh-token-repository.port'
import type { UserRepository } from '../ports/user-repository.port'

export interface ChangeOwnPasswordInput {
  userId: string
  currentPassword: string
  password: string
}

export class ChangeOwnPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(input: ChangeOwnPasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId)

    if (!user) {
      throw new UserNotFoundError()
    }

    const currentPasswordMatches = await this.passwordHasher.compare(
      input.currentPassword,
      user.senhaHash,
    )

    if (!currentPasswordMatches) {
      throw new InvalidCurrentPasswordError()
    }

    const senhaHash = await this.passwordHasher.hash(input.password)

    await this.userRepository.update(input.userId, { senhaHash })
    await this.refreshTokenRepository.revokeAllForUser(input.userId)
  }
}
