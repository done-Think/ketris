import { RENTER_TENANT_SLUG } from '@server/shared/domain/system-tenants'

import type { TenantAccountType } from '../types/tenant-account'
import type {
  MonthlyCharge,
  PlanUsageUnit,
  PlatformPlan,
  PlatformPlanResponse,
  TenantUsage,
} from '../types/platform-plan'

export function usageUnitFor(accountType: TenantAccountType): PlanUsageUnit {
  return accountType === 'AGENCY' ? 'BROKERS' : 'PROPERTIES'
}

export function isBillableTenant(slug: string): boolean {
  return slug !== RENTER_TENANT_SLUG
}

const toCents = (value: number) => Math.round(value * 100)
const fromCents = (cents: number) => cents / 100

export function calculateMonthlyCharge(plan: PlatformPlan, usage: TenantUsage): MonthlyCharge {
  const usageUnit = usageUnitFor(plan.accountType)
  const used = usageUnit === 'BROKERS' ? usage.brokers : usage.properties
  const extraUnits = Math.max(0, used - plan.includedUnits)
  const extraCents = extraUnits * toCents(plan.extraUnitPrice)
  const baseCents = toCents(plan.monthlyPrice)

  return {
    usageUnit,
    usage: used,
    includedUnits: plan.includedUnits,
    extraUnits,
    basePrice: fromCents(baseCents),
    extraAmount: fromCents(extraCents),
    total: fromCents(baseCents + extraCents),
  }
}

export function toPlatformPlanResponse(
  plan: PlatformPlan & { activeAccounts?: number },
): PlatformPlanResponse {
  return {
    accountType: plan.accountType,
    usageUnit: usageUnitFor(plan.accountType),
    monthlyPrice: plan.monthlyPrice,
    includedUnits: plan.includedUnits,
    extraUnitPrice: plan.extraUnitPrice,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    updatedBy: plan.updatedBy,
    ...(plan.activeAccounts === undefined ? {} : { activeAccounts: plan.activeAccounts }),
  }
}
