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
   * write only applies while the tenant still has the expected account type and status (the ones
   * the caller read); returns null when another update changed them first (or the tenant was
   * deleted), so no change is silently overwritten and the history never gets a stale fromStatus.
   */
  updateAccount(
    tenantId: string,
    expected: Pick<TenantAccount, 'accountType' | 'status'>,
    account: TenantAccount,
    statusChange: NewTenantStatusChange | null,
  ): Promise<PlatformTenant | null>
  /**
   * The status changes the monthly churn needs, oldest first: every change from `since` on, plus
   * each tenant's last change before it (enough to rebuild the status at `since`, see statusAt).
   * Older changes are left out, so the read does not grow with the age of the history.
   */
  findStatusChanges(since: Date): Promise<TenantStatusChange[]>
  // What each tenant uses of its plan: properties (except inactive) and active brokers.
  countUsage(): Promise<Map<string, TenantUsage>>
}
