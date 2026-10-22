import {
  calculateMonthlyCharge,
  isBillableTenant,
  type MonthlyCharge,
  type PlatformPlan,
  type TenantUsage,
} from './platform-plan'
import type { TenantAccount, TenantAccountType, TenantStatus } from './tenant-account'
import type { TenantSummary } from './tenant-summary.entity'

// A tenant as the platform admin sees it: the summary plus how the platform bills it.
export interface PlatformTenant extends TenantSummary, TenantAccount {}

// What the tenant's plan costs for its current usage; null for the renters' system tenant.
export interface ChargedPlatformTenant extends PlatformTenant {
  monthlyCharge: MonthlyCharge | null
}

export function chargePlatformTenants(
  tenants: PlatformTenant[],
  plans: PlatformPlan[],
  usageByTenant: Map<string, TenantUsage>,
): ChargedPlatformTenant[] {
  return tenants.map((tenant) => {
    const plan = plans.find((candidate) => candidate.accountType === tenant.accountType)
    const usage = usageByTenant.get(tenant.id) ?? { properties: 0, brokers: 0 }

    return {
      ...tenant,
      monthlyCharge:
        plan && isBillableTenant(tenant.slug) ? calculateMonthlyCharge(plan, usage) : null,
    }
  })
}

export interface PlatformTenantResponse {
  id: string
  name: string
  slug: string
  accountType: TenantAccountType
  status: TenantStatus
  canceledAt: Date | null
  createdAt: Date
  monthlyCharge?: MonthlyCharge | null
}

export function toPlatformTenantResponse(
  tenant: PlatformTenant | ChargedPlatformTenant,
): PlatformTenantResponse {
  return {
    id: tenant.id,
    name: tenant.nome,
    slug: tenant.slug,
    accountType: tenant.accountType,
    status: tenant.status,
    canceledAt: tenant.canceledAt,
    createdAt: tenant.createdAt,
    ...('monthlyCharge' in tenant ? { monthlyCharge: tenant.monthlyCharge } : {}),
  }
}
