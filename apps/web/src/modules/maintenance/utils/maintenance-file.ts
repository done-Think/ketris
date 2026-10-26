import {
  MAINTENANCE_ATTACHMENT_MAX_BYTES,
  MAINTENANCE_ATTACHMENT_TYPES,
} from '@server/maintenance/config/attachment-limits'

export class MaintenanceUploadValidationError extends Error {}

export function validateMaintenanceFile(file: File) {
  if (
    !file.name.trim() ||
    file.name.trim().length > 255 ||
    file.size === 0 ||
    file.size > MAINTENANCE_ATTACHMENT_MAX_BYTES ||
    !MAINTENANCE_ATTACHMENT_TYPES.some((type) => type === file.type)
  )
    throw new MaintenanceUploadValidationError()
}

export async function maintenanceFileSha256(file: File): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, '0')).join('')
}
