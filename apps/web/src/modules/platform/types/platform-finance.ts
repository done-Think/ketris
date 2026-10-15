import type { PlatformTenant, TenantAccountType } from './tenant'

export interface ApiPlatformFinance {
  referenceDate: string
  mrr: number
  payingAccounts: number
  trialAccounts: number
  suspendedAccounts: number
  canceledThisMonth: number
  churnRate: number | null
  byAccountType: { accountType: TenantAccountType; activeAccounts: number; mrr: number }[]
  accounts: PlatformTenant[]
}
