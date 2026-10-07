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

export interface MaintenanceAttachmentStoragePort {
  upload(input: UploadMaintenanceAttachmentInput): Promise<UploadedMaintenanceAttachment>
}
