import type { TenantStatus } from './tenant-account'

// One recorded status transition of a tenant (see TenantStatusChange in the schema).
export interface TenantStatusChange {
  tenantId: string
  fromStatus: TenantStatus
  toStatus: TenantStatus
  changedAt: Date
}

// Rebuilds a tenant's status at an instant from its append-only history. Only changes strictly
// before the instant are applied: a change recorded exactly at 00:00 of the 1st belongs to the new
// month, not to the status the month started with. Without history the status never changed, so
// the current one has held since creation. Returns null when the tenant did not exist yet.
export function statusAt(
  tenant: { status: TenantStatus; createdAt: Date },
  changes: readonly TenantStatusChange[],
  instant: Date,
): TenantStatus | null {
  if (tenant.createdAt >= instant) return null

  const sorted = [...changes].sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime())
  const applied = sorted.filter((change) => change.changedAt < instant)

  if (applied.length) return applied[applied.length - 1].toStatus
  if (sorted.length) return sorted[0].fromStatus

  return tenant.status
}

export function groupStatusChangesByTenant(
  changes: readonly TenantStatusChange[],
): Map<string, TenantStatusChange[]> {
  const byTenant = new Map<string, TenantStatusChange[]>()

  for (const change of changes) {
    const list = byTenant.get(change.tenantId) ?? []
    list.push(change)
    byTenant.set(change.tenantId, list)
  }

  return byTenant
}
