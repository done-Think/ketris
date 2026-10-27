import type { TENANT_ACCOUNT_TYPES, TENANT_STATUSES } from '../domain/tenant-account'

export type TenantAccountType = (typeof TENANT_ACCOUNT_TYPES)[number]

export type TenantStatus = (typeof TENANT_STATUSES)[number]

export interface TenantAccount {
  accountType: TenantAccountType
  status: TenantStatus
  canceledAt: Date | null
}
