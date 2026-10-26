import type {
  DownloadedMaintenanceAttachment,
  UploadedMaintenanceAttachment,
  UploadMaintenanceAttachmentInput,
} from '../../types/maintenance-attachment-storage'

export interface MaintenanceAttachmentReaderPort {
  download(key: string): Promise<DownloadedMaintenanceAttachment | null>
}

export interface MaintenanceAttachmentStoragePort {
  upload(input: UploadMaintenanceAttachmentInput): Promise<UploadedMaintenanceAttachment>
}
