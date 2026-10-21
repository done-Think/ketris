import { isBillableTenant, type PlatformPlan } from '../../domain/platform-plan'
import type { PlatformPlanRepository } from '../ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../ports/platform-tenant-repository.port'

export interface PlatformPlanWithAccounts extends PlatformPlan {
  activeAccounts: number
}

export class ListPlatformPlansUseCase {
  constructor(
    private readonly platformPlanRepository: PlatformPlanRepository,
    private readonly platformTenantRepository: PlatformTenantRepository,
  ) {}

  async execute(): Promise<PlatformPlanWithAccounts[]> {
    const [plans, tenants] = await Promise.all([
      this.platformPlanRepository.findAll(),
      this.platformTenantRepository.findMany(),
    ])

    return plans.map((plan) => ({
      ...plan,
      activeAccounts: tenants.filter(
        (tenant) =>
          tenant.accountType === plan.accountType &&
          tenant.status === 'ACTIVE' &&
          isBillableTenant(tenant.slug),
      ).length,
    }))
  }
}
