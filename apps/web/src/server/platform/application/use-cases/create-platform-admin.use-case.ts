import type { PasswordHasher } from '@server/auth/application/ports/password-hasher.port'

import { PlatformAdminEmailAlreadyInUseError } from '../../domain/errors'
import {
  toAuthenticatedPlatformAdmin,
  type AuthenticatedPlatformAdmin,
} from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'

export interface CreatePlatformAdminInput {
  nome: string
  email: string
  password: string
}

export type CreatePlatformAdminOutput = AuthenticatedPlatformAdmin

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
    })

    return toAuthenticatedPlatformAdmin(created)
  }
}
