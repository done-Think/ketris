import type {
  MaintenanceAction,
  MaintenancePermissions,
  MaintenanceProvider,
  MaintenanceOptions,
} from '@server/maintenance/types/maintenance-ticket'
export type { MaintenanceAction, MaintenancePermissions, MaintenanceProvider, MaintenanceOptions }

export type ApiMaintenanceTicketStatus =
  | 'ABERTO'
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_CONFIRMACAO'
  | 'RESOLVIDO'
  | 'CONTESTADO'
  | 'CANCELADO'
  | 'FECHADO'

export type ApiMaintenanceTicketPriority = 'NORMAL' | 'ALTA' | 'URGENTE'

export type ApiMaintenanceActivityType =
  import('@server/maintenance/types/maintenance-ticket').MaintenanceActivityType

export interface ApiMaintenanceActivity {
  id: string
  ticketId: string
  type: ApiMaintenanceActivityType
  message: string
  authorId: string | null
  authorName: string | null
  details?: Record<string, unknown> | null
  createdAt: string
}

export interface ApiMaintenanceAttachment {
  id: string
  ticketId: string
  name: string
  url: string
  createdAt: string
}

export interface ApiMaintenanceTicket {
  scheduledAt?: string | null
  id: string
  propertyId: string
  propertyTitle: string
  contractId?: string | null
  responsibleId?: string | null
  responsibleName?: string | null
  provider?: MaintenanceProvider | null
  deletedAt?: string | null
  permissions?: MaintenancePermissions
  replacementRequests?: {
    id: string
    reason: string
    status: 'PENDENTE' | 'APROVADA' | 'REJEITADA'
    requestedByName: string
    decisionReason: string | null
    decidedByName: string | null
    createdAt: string
  }[]
  category: string
  priority: ApiMaintenanceTicketPriority
  status: ApiMaintenanceTicketStatus
  title: string
  description: string
  openedById: string
  openedByName: string
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  activities: ApiMaintenanceActivity[]
  attachments: ApiMaintenanceAttachment[]
}

export interface ApiMaintenanceTicketListItem {
  scheduledAt?: string | null
  id: string
  propertyId: string
  propertyTitle: string
  contractId?: string | null
  deletedAt?: string | null
  permissions?: MaintenancePermissions
  category: string
  priority: ApiMaintenanceTicketPriority
  status: ApiMaintenanceTicketStatus
  title: string
  openedByName: string
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MaintenanceTicketListFilters {
  archived?: boolean
  status?: ApiMaintenanceTicketStatus
  priority?: ApiMaintenanceTicketPriority
  propertyId?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface CreateMaintenanceTicketPayload {
  scheduledAt?: string | null
  contractId: string
  propertyId: string
  category: string
  priority: ApiMaintenanceTicketPriority
  title: string
  description: string
}

export interface UpdateMaintenanceTicketPayload {
  scheduledAt?: string | null
  contractId?: string
  propertyId?: string
  category?: string
  priority?: ApiMaintenanceTicketPriority
  title?: string
  description?: string
}

export interface ListMaintenanceTicketsResponse {
  items: ApiMaintenanceTicketListItem[]
  totalCount: number
}

export interface MaintenanceTicketResponse {
  ticket: ApiMaintenanceTicket
}

export interface MaintenanceActivityResponse {
  activity: ApiMaintenanceActivity
}

export interface MaintenanceActivitiesResponse {
  activities: ApiMaintenanceActivity[]
}

export interface UploadMaintenanceTicketAttachmentResponse {
  attachment: ApiMaintenanceAttachment
}

export type { MaintenanceUserLinkInput } from '@server/maintenance/types/maintenance-ticket'

export interface UpdateMaintenanceTicketVariables {
  id: string
  payload: UpdateMaintenanceTicketPayload
}
