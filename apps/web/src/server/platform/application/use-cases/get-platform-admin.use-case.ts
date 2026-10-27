import { PlatformAdminNotFoundError } from '../../domain/errors'
import { toAuthenticatedPlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type { GetPlatformAdminInput, GetPlatformAdminOutput } from '../../types/use-case-inputs'

export class GetPlatformAdminUseCase {
  constructor(private readonly platformAdminRepository: PlatformAdminRepository) {}

  async execute(input: GetPlatformAdminInput): Promise<GetPlatformAdminOutput> {
    const admin = await this.platformAdminRepository.findById(input.platformAdminId)

    if (!admin) {
      throw new PlatformAdminNotFoundError()
    }

    return toAuthenticatedPlatformAdmin(admin)
  }
}
