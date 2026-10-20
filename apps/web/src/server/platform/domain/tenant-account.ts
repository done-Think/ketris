export const TENANT_ACCOUNT_TYPES = ['INDIVIDUAL', 'BROKER', 'AGENCY'] as const
export type TenantAccountType = (typeof TENANT_ACCOUNT_TYPES)[number]

export const TENANT_STATUSES = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED'] as const
export type TenantStatus = (typeof TENANT_STATUSES)[number]

// How a tenant is billed by the platform. The account type picks the plan (individual, broker or
// agency); only ACTIVE tenants are charged. Kept by a platform admin: there is no payment gateway.
export interface TenantAccount {
  accountType: TenantAccountType
  status: TenantStatus
  canceledAt: Date | null
}

// canceledAt is only the date of the current cancellation, shown on the tenant page: set when a
// tenant becomes CANCELED, kept while it stays canceled, cleared on reactivation. The churn does
// not read it; it uses the append-only status history (see platform-billing.ts), which keeps every
// past cancellation even after a reactivation.
export function resolveCanceledAt(
  current: Pick<TenantAccount, 'status' | 'canceledAt'>,
  nextStatus: TenantStatus,
  now: Date,
): Date | null {
  if (nextStatus !== 'CANCELED') return null
  if (current.status === 'CANCELED' && current.canceledAt) return current.canceledAt

  return now
}
