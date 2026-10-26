import type {
  MaintenanceAction,
  MaintenanceActor,
  MaintenanceTicketCategory,
  MaintenanceTicketListFilters,
  MaintenanceTicketPriority,
  MaintenanceTicketUpdate,
  MaintenanceUserLinkInput,
} from './maintenance-ticket'

export interface MaintenanceTicketInput extends MaintenanceActor {
  ticketId: string
}

export type AddMaintenanceTicketNoteInput = MaintenanceActor & { ticketId: string; message: string }

export interface CreateMaintenanceTicketInput extends MaintenanceActor {
  scheduledAt?: Date | null
  contractId: string
  propertyId?: string
  category: MaintenanceTicketCategory
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

export type ListMaintenanceTicketsInput = MaintenanceTicketListFilters

export type ActOnMaintenanceTicketInput = MaintenanceActor & {
  ticketId: string
  action: MaintenanceAction
}

export type LinkMaintenanceUsersInput = MaintenanceActor & MaintenanceUserLinkInput

export type GetMaintenanceAttachmentInput = MaintenanceActor & { keyParts: string[] }
