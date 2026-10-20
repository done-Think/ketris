import { groupStatusChangesByTenant } from '../../domain/tenant-status-history'
import { summarizeBilling } from '../../domain/platform-billing'
import type { PlatformOverview } from '../../domain/platform-overview.entity'
import { chargePlatformTenants } from '../../domain/platform-tenant.entity'
import type { PlatformOverviewRepository } from '../ports/platform-overview-repository.port'
import type { PlatformPlanRepository } from '../ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../ports/platform-tenant-repository.port'

export class GetPlatformOverviewUseCase {
  constructor(
    private readonly platformOverviewRepository: PlatformOverviewRepository,
    private readonly platformTenantRepository: PlatformTenantRepository,
    private readonly platformPlanRepository: PlatformPlanRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<PlatformOverview> {
    const referenceDate = this.now()
    const [overview, tenants, plans, usage, statusChanges] = await Promise.all([
      this.platformOverviewRepository.getOverview(referenceDate),
      this.platformTenantRepository.findMany(),
      this.platformPlanRepository.findAll(),
      this.platformTenantRepository.countUsage(),
      this.platformTenantRepository.findStatusChanges(),
    ])
    const { mrr, churnRate } = summarizeBilling(
      chargePlatformTenants(tenants, plans, usage),
      groupStatusChangesByTenant(statusChanges),
      referenceDate,
    )

    return { ...overview, metrics: { ...overview.metrics, mrr, churnRate } }
  }
}
