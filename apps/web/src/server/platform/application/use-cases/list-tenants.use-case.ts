import type { PlatformTenant } from '../../domain/platform-tenant.entity'
import type { PlatformTenantRepository } from '../ports/platform-tenant-repository.port'

export type ListTenantsOutput = PlatformTenant[]

export class ListTenantsUseCase {
  constructor(private readonly platformTenantRepository: PlatformTenantRepository) {}

  async execute(): Promise<ListTenantsOutput> {
    return this.platformTenantRepository.findMany()
  }
}
