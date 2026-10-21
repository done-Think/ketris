import type {
  MaintenanceActor,
  MaintenanceTicketPriority,
  MaintenanceTicketUpdate,
} from './maintenance-ticket'

export interface MaintenanceTicketInput extends MaintenanceActor {
  ticketId: string
}

export type AddMaintenanceTicketNoteInput = MaintenanceActor & { ticketId: string; message: string }

export interface CreateMaintenanceTicketInput extends MaintenanceActor {
  scheduledAt?: Date | null
  contractId: string
  propertyId?: string
  category: string
  priority: MaintenanceTicketPriority
  title: string
  description: string
}

export type ResolveMaintenanceTicketInput = MaintenanceActor & { ticketId: string }

export interface UpdateMaintenanceTicketInput extends MaintenanceActor, MaintenanceTicketUpdate {
  ticketId: string
}

export interface UploadMaintenanceTicketAttachmentInput extends MaintenanceActor {
  actorTenantId: string
  actorId: string
  actorName: string
  ticketId: string
  filename: string
  contentType: string
  body: Buffer
}
