import type { PlatformOverview } from '../../domain/platform-overview.entity'
import { loadPlatformBilling } from '../load-platform-billing'
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
    const [overview, billing] = await Promise.all([
      this.platformOverviewRepository.getOverview(referenceDate),
      loadPlatformBilling(
        this.platformTenantRepository,
        this.platformPlanRepository,
        referenceDate,
      ),
    ])
    const { mrr, churnRate } = billing.summary

    return { ...overview, metrics: { ...overview.metrics, mrr, churnRate } }
  }
}
