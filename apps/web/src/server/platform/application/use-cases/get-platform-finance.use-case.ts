import { groupStatusChangesByTenant } from '../../domain/tenant-status-history'
import { summarizeBilling, type BillingSummary } from '../../domain/platform-billing'
import {
  chargePlatformTenants,
  type ChargedPlatformTenant,
} from '../../domain/platform-tenant.entity'
import type { PlatformPlanRepository } from '../ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../ports/platform-tenant-repository.port'

export interface PlatformFinance extends BillingSummary {
  referenceDate: Date
  // Billable accounts, highest monthly fee first.
  accounts: ChargedPlatformTenant[]
}

export class GetPlatformFinanceUseCase {
  constructor(
    private readonly platformTenantRepository: PlatformTenantRepository,
    private readonly platformPlanRepository: PlatformPlanRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<PlatformFinance> {
    const referenceDate = this.now()
    const [tenants, plans, usage, statusChanges] = await Promise.all([
      this.platformTenantRepository.findMany(),
      this.platformPlanRepository.findAll(),
      this.platformTenantRepository.countUsage(),
      this.platformTenantRepository.findStatusChanges(),
    ])
    const charged = chargePlatformTenants(tenants, plans, usage)

    return {
      referenceDate,
      ...summarizeBilling(charged, groupStatusChangesByTenant(statusChanges), referenceDate),
      accounts: charged
        .filter((tenant) => tenant.monthlyCharge !== null)
        .sort((a, b) => (b.monthlyCharge?.total ?? 0) - (a.monthlyCharge?.total ?? 0)),
    }
  }
}
