import { summarizeBilling } from '../domain/platform-billing'
import type { BillingSummary } from '../types/platform-billing'
import { monthBoundsInTimeZone } from '../domain/platform-calendar'
import { chargePlatformTenants } from '../domain/platform-tenant.entity'
import type { ChargedPlatformTenant } from '../types/platform-tenant'
import { groupStatusChangesByTenant } from '../domain/tenant-status-history'
import type { PlatformPlanRepository } from './ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from './ports/platform-tenant-repository.port'

export interface PlatformBilling {
  charged: ChargedPlatformTenant[]
  summary: BillingSummary
}

export async function loadPlatformBilling(
  platformTenantRepository: PlatformTenantRepository,
  platformPlanRepository: PlatformPlanRepository,
  referenceDate: Date,
): Promise<PlatformBilling> {
  const month = monthBoundsInTimeZone(referenceDate)
  const [tenants, plans, usage, statusChanges] = await Promise.all([
    platformTenantRepository.findMany(),
    platformPlanRepository.findAll(),
    platformTenantRepository.countUsage(),
    platformTenantRepository.findStatusChanges(month.start),
  ])
  const charged = chargePlatformTenants(tenants, plans, usage)

  return {
    charged,
    summary: summarizeBilling(charged, groupStatusChangesByTenant(statusChanges), referenceDate),
  }
}
