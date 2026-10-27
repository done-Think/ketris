import type { TenantStatus } from './tenant-account'

export interface TenantStatusChange {
  tenantId: string
  fromStatus: TenantStatus
  toStatus: TenantStatus
  changedAt: Date
}
