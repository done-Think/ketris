import { maintenanceDraftSchema } from '../schemas/maintenance-draft-schema'
import type { MaintenanceCreateTicketFormValues } from '../types/maintenance'

export function maintenanceDraftKey(tenantId?: string, userId?: string) {
  return tenantId && userId ? `maintenance-draft:v1:${tenantId}:${userId}` : null
}

export function parseMaintenanceDraft(value: unknown): MaintenanceCreateTicketFormValues | null {
  const parsed = maintenanceDraftSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function readMaintenanceDraft(key: string | null): MaintenanceCreateTicketFormValues | null {
  if (!key) return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? parseMaintenanceDraft(JSON.parse(raw)) : null
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
  } catch {}
}
