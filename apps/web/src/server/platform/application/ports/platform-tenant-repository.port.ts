import type { PlatformTenant } from '../../domain/platform-tenant.entity'
import type { TenantAccount } from '../../domain/tenant-account'

export interface PlatformTenantRepository {
  findMany(): Promise<PlatformTenant[]>
  findById(tenantId: string): Promise<PlatformTenant | null>
  updateAccount(tenantId: string, account: TenantAccount): Promise<PlatformTenant>
}
