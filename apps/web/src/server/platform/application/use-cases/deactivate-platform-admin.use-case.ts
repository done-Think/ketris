import { CannotDeactivateSelfError, PlatformAdminNotFoundError } from '../../domain/errors'
import { toAuthenticatedPlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type {
  DeactivatePlatformAdminInput,
  DeactivatePlatformAdminOutput,
} from '../../types/use-case-inputs'

export class DeactivatePlatformAdminUseCase {
  constructor(private readonly platformAdminRepository: PlatformAdminRepository) {}

  async execute(input: DeactivatePlatformAdminInput): Promise<DeactivatePlatformAdminOutput> {
    if (input.actorId === input.platformAdminId) {
      throw new CannotDeactivateSelfError()
    }

    const target = await this.platformAdminRepository.findById(input.platformAdminId)

    if (!target) {
      throw new PlatformAdminNotFoundError()
    }

    const deactivated = await this.platformAdminRepository.deactivate(
      input.platformAdminId,
      input.actorId,
    )

    if (!deactivated) throw new PlatformAdminNotFoundError()

    return toAuthenticatedPlatformAdmin(deactivated)
  }
}
