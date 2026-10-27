import type { TenantAccountType } from './tenant-account'

export interface AccountTypeRevenue {
  accountType: TenantAccountType
  activeAccounts: number
  mrr: number
}

export interface BillingSummary {
  mrr: number
  payingAccounts: number
  trialAccounts: number
  suspendedAccounts: number
  canceledThisMonth: number
  churnBaseAccounts: number
  churnRate: number | null
  byAccountType: AccountTypeRevenue[]
}
