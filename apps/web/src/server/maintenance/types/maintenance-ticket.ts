import type { MaintenanceCategory } from '@shared/lib/utils/maintenance-categories'
import type { UserRole } from '@server/auth/domain/user.entity'

export type MaintenanceTicketStatus =
  'OPEN' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'RESOLVED' | 'DISPUTED' | 'CANCELED' | 'CLOSED'

export interface MaintenanceActor {
  actorTenantId: string
  actorId: string
  actorName: string
  actorRole: UserRole
}

export interface MaintenanceProvider {
  id?: string
  name: string
  phone?: string | null
  email?: string | null
  notes?: string | null
}

export interface MaintenanceReplacementRequest {
  id: string
  reason: string
  requestedById: string | null
  requestedByName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  decisionReason: string | null
  decidedByName: string | null
  decidedAt: Date | null
  createdAt: Date
}

export interface MaintenancePermissions {
  linkContract: boolean
  schedule: boolean
  edit: boolean
  comment: boolean
  collaborate: boolean
  assume: boolean
  assign: boolean
  provider: boolean
  requestReplacement: boolean
  start: boolean
  complete: boolean
  finish: boolean
  confirm: boolean
  contest: boolean
  cancel: boolean
  reopen: boolean
  delete: boolean
  restore: boolean
}

export interface MaintenanceContract {
  id: string
  tenantId: string
  code: string
  propertyId: string
  propertyTitle: string
  agentId: string
  ownerId: string | null
  renterIds: string[]
  parties: { id: string; name: string; role: string; userId: string | null }[]
}

export interface MaintenanceOptions {
  contracts: MaintenanceContract[]
  users: { id: string; name: string; role: UserRole }[]
}

export type MaintenanceTicketPriority = 'NORMAL' | 'HIGH' | 'URGENT'

export type MaintenanceActivityType =
  | 'NOTE'
  | 'STATUS_CHANGE'
  | 'ATTACHMENT_ADDED'
  | 'EDIT'
  | 'RESPONSIBLE_CHANGED'
  | 'PROVIDER_CHANGED'
  | 'CHANGE_REQUESTED'
  | 'CHANGE_DECIDED'
  | 'DELETION'
  | 'RESTORATION'

export interface MaintenanceActivity {
  systemAction?: string | null
  id: string
  ticketId: string
  type: MaintenanceActivityType
  message: string
  authorId: string | null
  authorName: string | null
  details?: Record<string, unknown> | null
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
  contractId: string | null
  responsibleId: string | null
  responsibleName: string | null
  provider: MaintenanceProvider | null
  completedByRole: UserRole | null
  deletedAt: Date | null
  replacementRequests: MaintenanceReplacementRequest[]
  permissions?: MaintenancePermissions
  access: { agentId: string; ownerId: string | null; renterIds: string[]; validContract: boolean }
  category: MaintenanceCategory
  priority: MaintenanceTicketPriority
  status: MaintenanceTicketStatus
  title: string
  description: string
  openedById: string | null
  openedByName: string
  resolvedAt: Date | null
  scheduledAt?: Date | null
  createdAt: Date
  updatedAt: Date
  activities: MaintenanceActivity[]
  attachments: MaintenanceAttachment[]
}

export interface MaintenanceTicketListItem {
  scheduledAt?: Date | null
  id: string
  propertyId: string
  propertyTitle: string
  contractId: string | null
  responsibleId: string | null
  responsibleName: string | null
  deletedAt: Date | null
  permissions: MaintenancePermissions
  category: MaintenanceCategory
  priority: MaintenanceTicketPriority
  status: MaintenanceTicketStatus
  title: string
  openedByName: string
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface MaintenanceTicketListResult {
  summary: import('./maintenance-summary').MaintenanceSummary
  pagination: import('./maintenance-summary').MaintenancePagination
  items: MaintenanceTicketListItem[]
  totalCount: number
}

export interface MaintenanceTicketListFilters {
  locale?: 'pt-BR' | 'en-US' | 'es-ES'
  tenantId: string
  actor: MaintenanceActor
  archived?: boolean
  status?: MaintenanceTicketStatus
  priority?: MaintenanceTicketPriority
  category?: MaintenanceCategory
  propertyId?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface NewMaintenanceTicket {
  scheduledAt?: Date | null
  tenantId: string
  propertyId: string
  contractId: string
  category: MaintenanceCategory
  priority: MaintenanceTicketPriority
  title: string
  description: string
  openedById: string
  openedByName: string
}

export interface MaintenanceTicketUpdate {
  scheduledAt?: Date | null
  propertyId?: string
  contractId?: string
  category?: MaintenanceCategory
  priority?: MaintenanceTicketPriority
  title?: string
  description?: string
}

export interface NewMaintenanceActivity {
  systemAction?: string
  authorRole?: UserRole
  type: MaintenanceActivityType
  message: string
  authorId: string | null
  authorName: string | null
  details?: Record<string, unknown>
}

export interface MaintenanceMutation extends MaintenanceTicketUpdate {
  status?: MaintenanceTicketStatus
  responsibleId?: string
  provider?: MaintenanceProvider
  completedByRole?: UserRole | null
  completedById?: string | null
  resolvedAt?: Date | null
  deletedAt?: Date | null
  deletedById?: string | null
}

export type MaintenanceRequestMutation =
  | { kind: 'request'; reason: string; actor: MaintenanceActor }
  | {
      kind: 'decision'
      requestId: string
      approved: boolean
      reason?: string
      actor: MaintenanceActor
    }

export type MaintenanceAction =
  | { action: 'schedule'; scheduledAt: string }
  | {
      [K in 'start' | 'complete' | 'finish' | 'confirm' | 'cancel' | 'assume' | 'restore']: {
        action: K
      }
    }['start' | 'complete' | 'finish' | 'confirm' | 'cancel' | 'assume' | 'restore']
  | { action: 'contest'; reason: string }
  | { action: 'linkContract'; contractId: string }
  | { action: 'reopen'; status: 'OPEN' | 'IN_PROGRESS'; reason?: string }
  | { action: 'assign'; responsibleId: string }
  | { action: 'provider'; provider: MaintenanceProvider }
  | { action: 'requestReplacement'; reason: string }
  | { action: 'approveReplacement'; requestId: string; provider: MaintenanceProvider }
  | { action: 'rejectReplacement'; requestId: string; reason: string }

export interface NewMaintenanceAttachment {
  uploadId?: string
  name: string
  url: string
  authorId: string | null
  authorName: string | null
}

export interface MaintenanceProperty {
  id: string
  title: string
}

export interface MaintenanceUserLinkInput {
  contractId: string
  ownerId?: string
  partyId?: string
  renterId?: string
}

export interface MaintenanceResponsibleUser {
  id: string
  role: string
}
