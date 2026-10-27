import { monthBoundsInTimeZone, PLATFORM_TIME_ZONE } from './platform-calendar'
import type { ChargedPlatformTenant } from '../types/platform-tenant'
import { TENANT_ACCOUNT_TYPES } from './tenant-account'
import { statusAt } from './tenant-status-history'
import type { TenantStatusChange } from '../types/tenant-status-history'
import type { BillingSummary } from '../types/platform-billing'

const sumCents = (values: number[]) =>
  values.reduce((cents, value) => cents + Math.round(value * 100), 0) / 100

export function calculateChurnRate(
  canceledThisMonth: number,
  baseAtMonthStart: number,
): number | null {
  if (baseAtMonthStart <= 0) return null

  return canceledThisMonth / baseAtMonthStart
}

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
