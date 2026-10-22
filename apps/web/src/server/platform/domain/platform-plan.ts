import { RENTER_TENANT_SLUG } from '@server/registration/application/use-cases/register-renter.use-case'

import type { TenantAccountType } from './tenant-account'

// What the included units of a plan count: properties for individuals and brokers, active brokers
// for agencies.
export type PlanUsageUnit = 'PROPERTIES' | 'BROKERS'

export interface PlatformPlan {
  accountType: TenantAccountType
  monthlyPrice: number
  includedUnits: number
  extraUnitPrice: number
  updatedAt: Date
}

export interface TenantUsage {
  properties: number
  brokers: number
}

export interface MonthlyCharge {
  usageUnit: PlanUsageUnit
  usage: number
  includedUnits: number
  extraUnits: number
  basePrice: number
  extraAmount: number
  total: number
}

export function usageUnitFor(accountType: TenantAccountType): PlanUsageUnit {
  return accountType === 'AGENCY' ? 'BROKERS' : 'PROPERTIES'
}

// The renters' tenant is a system account that groups renter users, not a customer.
export function isBillableTenant(slug: string): boolean {
  return slug !== RENTER_TENANT_SLUG
}

const toCents = (value: number) => Math.round(value * 100)
const fromCents = (cents: number) => cents / 100

// Base price plus every unit above the included ones, computed in cents to avoid float drift.
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

export interface PlatformPlanResponse {
  accountType: TenantAccountType
  usageUnit: PlanUsageUnit
  monthlyPrice: number
  includedUnits: number
  extraUnitPrice: number
  updatedAt: Date
  activeAccounts?: number
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
    updatedAt: plan.updatedAt,
    ...(plan.activeAccounts === undefined ? {} : { activeAccounts: plan.activeAccounts }),
  }
}
