import type { PlatformPlan } from '../../types/platform-plan'
import type { TenantAccountType } from '../../types/tenant-account'
import type { PlatformPlanActor, PlatformPlanPrices } from '../../types/platform-plan-repository'

export interface PlatformPlanRepository {
  findAll(): Promise<PlatformPlan[]>
  update(
    accountType: TenantAccountType,
    prices: PlatformPlanPrices,
    actor: PlatformPlanActor,
  ): Promise<PlatformPlan | null>
}
