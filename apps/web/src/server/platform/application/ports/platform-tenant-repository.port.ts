import type { PlatformTenant } from '../../domain/platform-tenant.entity'
import type { TenantUsage } from '../../domain/platform-plan'
import type { TenantAccount, TenantStatus } from '../../domain/tenant-account'
import type { TenantStatusChange } from '../../domain/tenant-status-history'

export interface NewTenantStatusChange {
  fromStatus: TenantStatus
  toStatus: TenantStatus
  changedAt: Date
  changedById: string | null
}

export interface PlatformTenantRepository {
  findMany(): Promise<PlatformTenant[]>
  findById(tenantId: string): Promise<PlatformTenant | null>
  /**
   * Saves the account and, when the status changes, appends the status change, atomically. The
   * write only applies while the tenant still has expectedStatus (the one the caller read);
   * returns null when another update changed it first, so the history never gets a stale
   * fromStatus.
   */
  updateAccount(
    tenantId: string,
    expectedStatus: TenantStatus,
    account: TenantAccount,
    statusChange: NewTenantStatusChange | null,
  ): Promise<PlatformTenant | null>
  // Every recorded status change, oldest first (base of the monthly churn).
  findStatusChanges(): Promise<TenantStatusChange[]>
  // What each tenant uses of its plan: properties (except inactive) and active brokers.
  countUsage(): Promise<Map<string, TenantUsage>>
}
