import { toAuthenticatedPlatformAdmin } from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'
import type { ListPlatformAdminsOutput } from '../../types/use-case-inputs'

export class ListPlatformAdminsUseCase {
  constructor(private readonly platformAdminRepository: PlatformAdminRepository) {}

  async execute(): Promise<ListPlatformAdminsOutput> {
    const admins = await this.platformAdminRepository.findMany()

    return admins.map(toAuthenticatedPlatformAdmin)
  }
}
