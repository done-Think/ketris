import { loadPlatformBilling } from '../load-platform-billing'
import type { PlatformPlanRepository } from '../ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../ports/platform-tenant-repository.port'
import type { PlatformFinance } from '../../types/use-case-inputs'

export class GetPlatformFinanceUseCase {
  constructor(
    private readonly platformTenantRepository: PlatformTenantRepository,
    private readonly platformPlanRepository: PlatformPlanRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<PlatformFinance> {
    const referenceDate = this.now()
    const { charged, summary } = await loadPlatformBilling(
      this.platformTenantRepository,
      this.platformPlanRepository,
      referenceDate,
    )

    return {
      referenceDate,
      ...summary,
      accounts: charged
        .filter((tenant) => tenant.monthlyCharge !== null)
        .sort((a, b) => (b.monthlyCharge?.total ?? 0) - (a.monthlyCharge?.total ?? 0)),
    }
  }
}
