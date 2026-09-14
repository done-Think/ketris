import {
  toAuthenticatedPlatformAdmin,
  type AuthenticatedPlatformAdmin,
} from '../../domain/platform-admin.entity'
import type { PlatformAdminRepository } from '../ports/platform-admin-repository.port'

export type ListPlatformAdminsOutput = AuthenticatedPlatformAdmin[]

export class ListPlatformAdminsUseCase {
  constructor(private readonly platformAdminRepository: PlatformAdminRepository) {}

  async execute(): Promise<ListPlatformAdminsOutput> {
    const admins = await this.platformAdminRepository.findMany()

    return admins.map(toAuthenticatedPlatformAdmin)
  }
}
