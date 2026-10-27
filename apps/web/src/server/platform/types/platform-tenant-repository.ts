import type { TenantStatus } from './tenant-account'

export interface NewTenantStatusChange {
  fromStatus: TenantStatus
  toStatus: TenantStatus
  changedAt: Date
  changedById: string | null
}
