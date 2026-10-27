import type { PlatformTenant } from '../../types/platform-tenant'
import type { TenantUsage } from '../../types/platform-plan'
import type { TenantAccount } from '../../types/tenant-account'
import type { TenantStatusChange } from '../../types/tenant-status-history'
import type { TenantListQuery, TenantPage, TenantStatusCounts } from '../../types/tenant-list'
import type { NewTenantStatusChange } from '../../types/platform-tenant-repository'

export interface PlatformTenantRepository {
  findMany(): Promise<PlatformTenant[]>
  findPage(query: TenantListQuery): Promise<TenantPage>
  countByStatus(query: Pick<TenantListQuery, 'q' | 'accountType'>): Promise<TenantStatusCounts>
  findById(tenantId: string): Promise<PlatformTenant | null>
  updateAccount(
    tenantId: string,
    expected: Pick<TenantAccount, 'accountType' | 'status'>,
    account: TenantAccount,
    statusChange: NewTenantStatusChange | null,
  ): Promise<PlatformTenant | null>
  findStatusChanges(since: Date): Promise<TenantStatusChange[]>
  countUsage(tenantIds?: string[]): Promise<Map<string, TenantUsage>>
}
