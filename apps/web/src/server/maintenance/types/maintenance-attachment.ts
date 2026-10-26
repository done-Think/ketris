export interface MaintenanceMediaObject {
  objectKey: string
  tenantId: string
  // The URL stored on the attachment row, used to find which ticket owns the file.
  url: string
}
