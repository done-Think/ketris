import {
  PlatformAdminEmailAlreadyInUseError,
  PlatformAdminNotFoundError,
} from '../../domain/errors'
import { toAuthenticatedPlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type {
  UpdatePlatformAdminInput,
  UpdatePlatformAdminOutput,
} from '../../types/use-case-inputs'

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

    const updated = await this.platformAdminRepository.update(
      input.platformAdminId,
      { name: input.name, email: input.email, role: input.role, active: input.active },
      input.actorId,
    )

    if (!updated) throw new PlatformAdminNotFoundError()

    return toAuthenticatedPlatformAdmin(updated)
  }
}
