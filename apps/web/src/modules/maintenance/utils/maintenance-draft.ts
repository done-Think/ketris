import type { MaintenanceCreateTicketFormValues } from '../types/maintenance'
import { normalizeDraftCategory } from './maintenance-category'

export function maintenanceDraftKey(tenantId?: string, userId?: string) {
  return tenantId && userId ? `maintenance-draft:v1:${tenantId}:${userId}` : null
}

export function readMaintenanceDraft(key: string | null): MaintenanceCreateTicketFormValues | null {
  if (!key) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    const draft = data as Record<string, unknown>
    if (
      !['contractId', 'propertyId', 'category', 'title', 'description'].every(
        (field) => typeof draft[field] === 'string',
      ) ||
      !['normal', 'high', 'urgent'].includes(String(draft.priority))
    )
      return null
    return {
      contractId: String(draft.contractId),
      propertyId: String(draft.propertyId),
      category: normalizeDraftCategory(String(draft.category)),
      title: String(draft.title),
      description: String(draft.description),
      priority: draft.priority as MaintenanceCreateTicketFormValues['priority'],
    }
  } catch {
    return null
  }
}

export function writeMaintenanceDraft(
  key: string | null,
  values: MaintenanceCreateTicketFormValues | null,
) {
  if (!key) return
  try {
    if (values) window.localStorage.setItem(key, JSON.stringify(values))
    else window.localStorage.removeItem(key)
  } catch {
    /* Storage may be unavailable in private browsing. */
  }
}
