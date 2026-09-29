export type MaintenanceTicketStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO' | 'FECHADO'

export type MaintenanceTicketPriority = 'NORMAL' | 'ALTA' | 'URGENTE'

export type MaintenanceActivityType = 'NOTA' | 'MUDANCA_STATUS' | 'ANEXO_ADICIONADO'

export interface MaintenanceActivity {
  id: string
  ticketId: string
  type: MaintenanceActivityType
  message: string
  authorId: string | null
  authorName: string | null
  createdAt: Date
}

export interface MaintenanceAttachment {
  id: string
  ticketId: string
  name: string
  url: string
  createdAt: Date
}

export interface MaintenanceTicket {
  id: string
  tenantId: string
  propertyId: string
  propertyTitle: string
  category: string
  priority: MaintenanceTicketPriority
  status: MaintenanceTicketStatus
  title: string
  description: string
  openedById: string
  openedByName: string
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
  activities: MaintenanceActivity[]
  attachments: MaintenanceAttachment[]
}

export interface MaintenanceTicketListItem {
  id: string
  propertyId: string
  propertyTitle: string
  category: string
  priority: MaintenanceTicketPriority
  status: MaintenanceTicketStatus
  title: string
  openedByName: string
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface MaintenanceTicketListResult {
  items: MaintenanceTicketListItem[]
  totalCount: number
}

export interface MaintenanceTicketListFilters {
  tenantId: string
  status?: MaintenanceTicketStatus
  propertyId?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface NewMaintenanceTicket {
  tenantId: string
  propertyId: string
  category: string
  priority: MaintenanceTicketPriority
  title: string
  description: string
  openedById: string
  openedByName: string
}

export interface MaintenanceTicketUpdate {
  propertyId?: string
  category?: string
  priority?: MaintenanceTicketPriority
  title?: string
  description?: string
}

export interface NewMaintenanceActivity {
  type: MaintenanceActivityType
  message: string
  authorId: string | null
  authorName: string | null
}

export interface MaintenanceProperty {
  id: string
  title: string
}
