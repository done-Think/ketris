import {
  PlatformAdminEmailAlreadyInUseError,
  PlatformAdminNotFoundError,
} from '../../domain/errors'
import {
  toAuthenticatedPlatformAdmin,
  type AuthenticatedPlatformAdmin,
} from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'

export interface UpdatePlatformAdminInput {
  platformAdminId: string
  nome?: string
  email?: string
}

export type UpdatePlatformAdminOutput = AuthenticatedPlatformAdmin

export class UpdatePlatformAdminUseCase {
  constructor(private readonly platformAdminRepository: PlatformAdminRepository) {}

  async execute(input: UpdatePlatformAdminInput): Promise<UpdatePlatformAdminOutput> {
    const target = await this.platformAdminRepository.findById(input.platformAdminId)

    if (!target) {
      throw new PlatformAdminNotFoundError()
    }

    if (input.email && input.email !== target.email) {
      const existing = await this.platformAdminRepository.findByEmail(input.email)

      if (existing) {
        throw new PlatformAdminEmailAlreadyInUseError()
      }
    }

    const updated = await this.platformAdminRepository.update(input.platformAdminId, {
      nome: input.nome,
      email: input.email,
    })

    return toAuthenticatedPlatformAdmin(updated)
  }
}
