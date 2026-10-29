import type { ChargedPlatformTenant, PlatformTenant } from './platform-tenant'
import type { TenantAccountType, TenantStatus } from './tenant-account'

export interface TenantListQuery {
  q?: string
  status?: TenantStatus
  accountType?: TenantAccountType
  page: number
  pageSize: number
}

export interface TenantPage {
  items: PlatformTenant[]
  totalCount: number
}

export type TenantStatusCounts = Record<TenantStatus, number>

export interface ChargedTenantPage {
  items: ChargedPlatformTenant[]
  totalCount: number
  page: number
  pageSize: number
  statusCounts: TenantStatusCounts
}

export interface PageQuery {
  page: number
  pageSize: number
}
