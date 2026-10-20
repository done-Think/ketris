import { monthBoundsInTimeZone, PLATFORM_TIME_ZONE } from './platform-calendar'
import type { ChargedPlatformTenant } from './platform-tenant.entity'
import { TENANT_ACCOUNT_TYPES, type TenantAccountType } from './tenant-account'
import { statusAt, type TenantStatusChange } from './tenant-status-history'

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
  // Accounts of the churn base (see summarizeBilling) that canceled during the month.
  canceledThisMonth: number
  // Accounts paying (ACTIVE) at 00:00 of the 1st of the month, in the platform time zone.
  churnBaseAccounts: number
  // canceledThisMonth / churnBaseAccounts (0–1); null when there was no base to measure against.
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
//
// Churn is rebuilt from the append-only status history, so it never changes after the fact:
// - base: accounts that were ACTIVE (paying) at 00:00 of the 1st of the month in the platform time
//   zone. TRIAL accounts are not paying yet and SUSPENDED ones are not paying anymore, so their
//   cancellation is not lost revenue and they stay out of the base.
// - churned: accounts of the base with at least one change to CANCELED during the month, counted
//   once, even if they were reactivated later (reactivation adds history, it doesn't erase it).
export function summarizeBilling(
  tenants: ChargedPlatformTenant[],
  statusChangesByTenant: ReadonlyMap<string, readonly TenantStatusChange[]>,
  referenceDate: Date,
  timeZone: string = PLATFORM_TIME_ZONE,
): BillingSummary {
  const billable = tenants.filter((tenant) => tenant.monthlyCharge !== null)
  const active = billable.filter((tenant) => tenant.status === 'ACTIVE')
  const month = monthBoundsInTimeZone(referenceDate, timeZone)
  const changesOf = (tenantId: string) => statusChangesByTenant.get(tenantId) ?? []
  const churnBase = billable.filter(
    (tenant) => statusAt(tenant, changesOf(tenant.id), month.start) === 'ACTIVE',
  )
  const canceledThisMonth = churnBase.filter((tenant) =>
    changesOf(tenant.id).some(
      (change) =>
        change.toStatus === 'CANCELED' &&
        change.changedAt >= month.start &&
        change.changedAt < month.end,
    ),
  ).length

  return {
    mrr: sumCents(active.map((tenant) => tenant.monthlyCharge?.total ?? 0)),
    payingAccounts: active.length,
    trialAccounts: billable.filter((tenant) => tenant.status === 'TRIAL').length,
    suspendedAccounts: billable.filter((tenant) => tenant.status === 'SUSPENDED').length,
    canceledThisMonth,
    churnBaseAccounts: churnBase.length,
    churnRate: calculateChurnRate(canceledThisMonth, churnBase.length),
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
