import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'

import { PlatformAdminEmailAlreadyInUseError } from '../../domain/errors'
import { toAuthenticatedPlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type {
  CreatePlatformAdminInput,
  CreatePlatformAdminOutput,
} from '../../types/use-case-inputs'

export class CreatePlatformAdminUseCase {
  constructor(
    private readonly platformAdminRepository: PlatformAdminRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreatePlatformAdminInput): Promise<CreatePlatformAdminOutput> {
    const existing = await this.platformAdminRepository.findByEmail(input.email)

    if (existing) {
      throw new PlatformAdminEmailAlreadyInUseError()
    }

    const senhaHash = await this.passwordHasher.hash(input.password)

    const created = await this.platformAdminRepository.create({
      nome: input.nome,
      email: input.email,
      senhaHash,
      role: input.role,
    })

    return toAuthenticatedPlatformAdmin(created)
  }
}
