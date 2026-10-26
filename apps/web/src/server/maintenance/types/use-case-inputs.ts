import type { MaintenanceCategory } from '@shared/lib/utils/maintenance-categories'
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
  category: MaintenanceCategory
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

export interface MaintenanceActionInput extends MaintenanceTicketInput {
  action: import('./maintenance-ticket').MaintenanceAction
}

export interface RegularizeMaintenanceLinksInput extends MaintenanceActor {
  links: import('./maintenance-ticket').MaintenanceUserLinkInput
}

export interface GetMaintenanceAttachmentInput extends MaintenanceActor {
  key: string[]
}
