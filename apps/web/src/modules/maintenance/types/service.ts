export type ApiMaintenanceTicketStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'FECHADO'

export type ApiMaintenanceTicketPriority = 'NORMAL' | 'ALTA' | 'URGENTE'

export type ApiMaintenanceActivityType = 'NOTA' | 'MUDANCA_STATUS' | 'ANEXO_ADICIONADO'

export interface ApiMaintenanceActivity {
  id: string
  ticketId: string
  type: ApiMaintenanceActivityType
  message: string
  authorId: string | null
  authorName: string | null
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
  id: string
  propertyId: string
  propertyTitle: string
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
  id: string
  propertyId: string
  propertyTitle: string
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
  status?: ApiMaintenanceTicketStatus
  propertyId?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface CreateMaintenanceTicketPayload {
  propertyId: string
  category: string
  priority: ApiMaintenanceTicketPriority
  title: string
  description: string
}

export interface UpdateMaintenanceTicketPayload {
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
