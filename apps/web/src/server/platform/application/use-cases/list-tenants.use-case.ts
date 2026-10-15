import {
  chargePlatformTenants,
  type ChargedPlatformTenant,
} from '../../domain/platform-tenant.entity'
import type { PlatformPlanRepository } from '../ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../ports/platform-tenant-repository.port'

export type ListTenantsOutput = ChargedPlatformTenant[]

export class ListTenantsUseCase {
  constructor(
    private readonly platformTenantRepository: PlatformTenantRepository,
    private readonly platformPlanRepository: PlatformPlanRepository,
  ) {}

  async execute(): Promise<ListTenantsOutput> {
    const [tenants, plans, usage] = await Promise.all([
      this.platformTenantRepository.findMany(),
      this.platformPlanRepository.findAll(),
      this.platformTenantRepository.countUsage(),
    ])

    return chargePlatformTenants(tenants, plans, usage)
  }
}
