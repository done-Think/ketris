import type {
  MaintenanceUploadDescriptor,
  MaintenanceUploadedObject,
  MaintenanceUploadLocation,
} from '../../types/maintenance-upload'

export interface MaintenanceDirectUploadStorage {
  uploadLocation(
    key: string,
    descriptor: MaintenanceUploadDescriptor,
  ): Promise<MaintenanceUploadLocation>
  inspect(key: string): Promise<MaintenanceUploadedObject>
}
export interface MaintenanceUploadTickets {
  issue(descriptor: MaintenanceUploadDescriptor): Promise<string>
  verify(token: string): Promise<MaintenanceUploadDescriptor>
}

export interface MaintenanceUploadIds {
  generate(): string
}
