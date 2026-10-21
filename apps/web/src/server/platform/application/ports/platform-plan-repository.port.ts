import type { PlatformPlan } from '../../domain/platform-plan'
import type { TenantAccountType } from '../../domain/tenant-account'

export interface PlatformPlanPrices {
  monthlyPrice: number
  includedUnits: number
  extraUnitPrice: number
}

export interface PlatformPlanRepository {
  findAll(): Promise<PlatformPlan[]>
  update(accountType: TenantAccountType, prices: PlatformPlanPrices): Promise<PlatformPlan>
}
