import type { TenantAccount, TenantStatus } from '../types/tenant-account'

export const TENANT_ACCOUNT_TYPES = ['INDIVIDUAL', 'BROKER', 'AGENCY'] as const

export const TENANT_STATUSES = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED'] as const

export function resolveCanceledAt(
  current: Pick<TenantAccount, 'status' | 'canceledAt'>,
  nextStatus: TenantStatus,
  now: Date,
): Date | null {
  if (nextStatus !== 'CANCELED') return null
  if (current.status === 'CANCELED' && current.canceledAt) return current.canceledAt

  return now
}
