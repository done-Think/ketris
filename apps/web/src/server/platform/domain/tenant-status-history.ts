import type { TenantStatus } from '../types/tenant-account'
import type { TenantStatusChange } from '../types/tenant-status-history'

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
