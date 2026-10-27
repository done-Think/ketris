import { TenantNotFoundError } from '../../domain/errors'
import { chargePlatformTenants } from '../../domain/platform-tenant.entity'
import type { ChargedPlatformTenant } from '../../types/platform-tenant'
import type { PlatformPlanRepository } from '../ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../ports/platform-tenant-repository.port'

export class GetPlatformTenantUseCase {
  constructor(
    private readonly platformTenantRepository: PlatformTenantRepository,
    private readonly platformPlanRepository: PlatformPlanRepository,
  ) {}

  async execute(tenantId: string): Promise<ChargedPlatformTenant> {
    const tenant = await this.platformTenantRepository.findById(tenantId)
    if (!tenant) throw new TenantNotFoundError()
    const [plans, usage] = await Promise.all([
      this.platformPlanRepository.findAll(),
      this.platformTenantRepository.countUsage([tenant.id]),
    ])
    const [charged] = chargePlatformTenants([tenant], plans, usage)

    return charged
  }
}
