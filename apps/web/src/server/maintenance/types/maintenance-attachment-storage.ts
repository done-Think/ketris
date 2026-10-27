export interface UploadMaintenanceAttachmentInput {
  tenantId: string
  filename: string
  contentType: string
  body: Buffer
}

export interface UploadedMaintenanceAttachment {
  url: string
  contentType: string
}

export type { MaintenanceAttachmentStoragePort } from '../application/ports/maintenance-attachment-storage.port'

export interface DownloadedMaintenanceAttachment {
  url: string
}
