import { sanitizeUploadFilename } from '@server/shared/storage/sanitize-filename'
import type { MaintenanceUploadDescriptor } from '../types/maintenance-upload'

export function maintenanceAttachmentKey(descriptor: MaintenanceUploadDescriptor) {
  return `maintenance/${descriptor.tenantId}/${descriptor.uploadId}-${sanitizeUploadFilename(descriptor.filename)}`
}
