import type { TenantSummary } from './tenant-summary'
import type { TenantAccount, TenantAccountType, TenantStatus } from './tenant-account'
import type { MonthlyCharge } from './platform-plan'

export interface PlatformTenant extends TenantSummary, TenantAccount {}

export interface ChargedPlatformTenant extends PlatformTenant {
  monthlyCharge: MonthlyCharge | null
}

export interface PlatformTenantResponse {
  id: string
  name: string
  slug: string
  accountType: TenantAccountType
  status: TenantStatus
  canceledAt: Date | null
  createdAt: Date
  monthlyCharge?: MonthlyCharge | null
}
