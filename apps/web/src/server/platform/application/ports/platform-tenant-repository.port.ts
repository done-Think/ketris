import type { PlatformTenant } from '../../domain/platform-tenant.entity'
import type { TenantUsage } from '../../domain/platform-plan'
import type { TenantAccount } from '../../domain/tenant-account'

export interface PlatformTenantRepository {
  findMany(): Promise<PlatformTenant[]>
  findById(tenantId: string): Promise<PlatformTenant | null>
  updateAccount(tenantId: string, account: TenantAccount): Promise<PlatformTenant>
  // What each tenant uses of its plan: properties (except inactive) and active brokers.
  countUsage(): Promise<Map<string, TenantUsage>>
}
