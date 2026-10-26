import type { MaintenanceActor } from './maintenance-ticket'

export interface MaintenanceUploadDescriptor {
  uploadId: string
  actorId: string
  tenantId: string
  ticketId: string
  filename: string
  contentType: string
  size: number
  sha256: string
}
export interface MaintenanceUploadLocation {
  url: string
  headers: Record<string, string>
}
export interface MaintenanceUploadedObject {
  size: number
  contentType: string | null
  sha256: string | null
}
export interface PrepareMaintenanceUploadInput extends MaintenanceActor {
  ticketId: string
  filename: string
  contentType: string
  size: number
  sha256: string
}
export interface CompleteMaintenanceUploadInput extends MaintenanceActor {
  ticketId: string
  token: string
}
