import type { TenantAccount, TenantAccountType, TenantStatus } from './tenant-account'
import type { TenantSummary } from './tenant-summary.entity'

// A tenant as the platform admin sees it: the summary plus how the platform bills it.
export interface PlatformTenant extends TenantSummary, TenantAccount {}

export interface PlatformTenantResponse {
  id: string
  name: string
  slug: string
  accountType: TenantAccountType
  status: TenantStatus
  canceledAt: Date | null
  createdAt: Date
}

export function toPlatformTenantResponse(tenant: PlatformTenant): PlatformTenantResponse {
  return {
    id: tenant.id,
    name: tenant.nome,
    slug: tenant.slug,
    accountType: tenant.accountType,
    status: tenant.status,
    canceledAt: tenant.canceledAt,
    createdAt: tenant.createdAt,
  }
}
