import { calculateMonthlyCharge, isBillableTenant } from './platform-plan'
import type { PlatformPlan, TenantUsage } from '../types/platform-plan'
import type {
  ChargedPlatformTenant,
  PlatformTenant,
  PlatformTenantResponse,
} from '../types/platform-tenant'

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
