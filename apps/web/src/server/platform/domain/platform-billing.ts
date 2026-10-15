import type { ChargedPlatformTenant } from './platform-tenant.entity'
import { TENANT_ACCOUNT_TYPES, type TenantAccountType } from './tenant-account'

export interface AccountTypeRevenue {
  accountType: TenantAccountType
  activeAccounts: number
  mrr: number
}

export interface BillingSummary {
  // Sum of the monthly fees of the ACTIVE accounts, in BRL.
  mrr: number
  payingAccounts: number
  trialAccounts: number
  suspendedAccounts: number
  canceledThisMonth: number
  // Share (0–1) of the accounts in the base on the first day of the month that canceled during
  // it; null when there was no base to measure against.
  churnRate: number | null
  byAccountType: AccountTypeRevenue[]
}

const sumCents = (values: number[]) =>
  values.reduce((cents, value) => cents + Math.round(value * 100), 0) / 100

export function calculateChurnRate(
  canceledThisMonth: number,
  baseAtMonthStart: number,
): number | null {
  if (baseAtMonthStart <= 0) return null

  return canceledThisMonth / baseAtMonthStart
}

// Billable accounts only (the renters' system tenant has no monthly charge).
export function summarizeBilling(
  tenants: ChargedPlatformTenant[],
  referenceDate: Date,
): BillingSummary {
  const billable = tenants.filter((tenant) => tenant.monthlyCharge !== null)
  const active = billable.filter((tenant) => tenant.status === 'ACTIVE')
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const nextMonthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1)
  // Churn cohort: accounts created before the month and not canceled before it.
  const baseAtMonthStart = billable.filter(
    (tenant) =>
      tenant.createdAt < monthStart && (!tenant.canceledAt || tenant.canceledAt >= monthStart),
  )
  const canceledThisMonth = baseAtMonthStart.filter(
    (tenant) =>
      tenant.status === 'CANCELED' &&
      tenant.canceledAt !== null &&
      tenant.canceledAt < nextMonthStart,
  ).length

  return {
    mrr: sumCents(active.map((tenant) => tenant.monthlyCharge?.total ?? 0)),
    payingAccounts: active.length,
    trialAccounts: billable.filter((tenant) => tenant.status === 'TRIAL').length,
    suspendedAccounts: billable.filter((tenant) => tenant.status === 'SUSPENDED').length,
    canceledThisMonth,
    churnRate: calculateChurnRate(canceledThisMonth, baseAtMonthStart.length),
    byAccountType: TENANT_ACCOUNT_TYPES.map((accountType) => {
      const accounts = active.filter((tenant) => tenant.accountType === accountType)

      return {
        accountType,
        activeAccounts: accounts.length,
        mrr: sumCents(accounts.map((tenant) => tenant.monthlyCharge?.total ?? 0)),
      }
    }),
  }
}
