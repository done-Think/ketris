import { formatDate } from '@shared/lib/utils/format'

import type {
  ApiMaintenanceTicket,
  ApiMaintenanceTicketListItem,
  ApiMaintenanceTicketPriority,
  ApiMaintenanceTicketStatus,
  CreateMaintenanceTicketPayload,
  UpdateMaintenanceTicketPayload,
} from '../types/service'
import type {
  MaintenanceCreateTicketFormValues,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceTicket,
} from '../types/maintenance'

const statusFromApiMap: Record<ApiMaintenanceTicketStatus, MaintenanceStatus> = {
  ABERTO: 'open',
  EM_ANDAMENTO: 'inProgress',
  RESOLVIDO: 'resolved',
  FECHADO: 'closed',
}

const statusToApiMap: Record<MaintenanceStatus, ApiMaintenanceTicketStatus> = {
  open: 'ABERTO',
  inProgress: 'EM_ANDAMENTO',
  resolved: 'RESOLVIDO',
  closed: 'FECHADO',
}

const priorityFromApiMap: Record<ApiMaintenanceTicketPriority, MaintenancePriority> = {
  NORMAL: 'normal',
  ALTA: 'high',
  URGENTE: 'urgent',
}

const priorityToApiMap: Record<MaintenancePriority, ApiMaintenanceTicketPriority> = {
  normal: 'NORMAL',
  high: 'ALTA',
  urgent: 'URGENTE',
}

export function mapMaintenanceStatusFromApi(status: ApiMaintenanceTicketStatus): MaintenanceStatus {
  return statusFromApiMap[status]
}

export function mapMaintenanceStatusToApi(status: MaintenanceStatus): ApiMaintenanceTicketStatus {
  return statusToApiMap[status]
}

export function mapMaintenancePriorityFromApi(
  priority: ApiMaintenanceTicketPriority,
): MaintenancePriority {
  return priorityFromApiMap[priority]
}

export function mapMaintenancePriorityToApi(
  priority: MaintenancePriority,
): ApiMaintenanceTicketPriority {
  return priorityToApiMap[priority]
}

export function mapMaintenanceTicketListItemFromApi(
  item: ApiMaintenanceTicketListItem,
): MaintenanceTicket {
  return {
    id: item.id,
    propertyId: item.propertyId,
    property: item.propertyTitle,
    category: item.category,
    priority: mapMaintenancePriorityFromApi(item.priority),
    tenant: item.openedByName,
    openedAt: formatDate(item.createdAt),
    status: mapMaintenanceStatusFromApi(item.status),
    title: item.title,
  }
}

export function mapMaintenanceTicketFromApi(ticket: ApiMaintenanceTicket): MaintenanceTicket {
  return {
    id: ticket.id,
    propertyId: ticket.propertyId,
    property: ticket.propertyTitle,
    category: ticket.category,
    priority: mapMaintenancePriorityFromApi(ticket.priority),
    tenant: ticket.openedByName,
    openedAt: formatDate(ticket.createdAt),
    status: mapMaintenanceStatusFromApi(ticket.status),
    title: ticket.title,
    description: ticket.description,
  }
}

export function mapMaintenanceTicketToFormValues(
  ticket: ApiMaintenanceTicket,
): MaintenanceCreateTicketFormValues {
  return {
    propertyId: ticket.propertyId,
    category: ticket.category,
    priority: mapMaintenancePriorityFromApi(ticket.priority),
    title: ticket.title,
    description: ticket.description,
  }
}

export function buildCreateMaintenanceTicketPayload(
  values: MaintenanceCreateTicketFormValues,
): CreateMaintenanceTicketPayload {
  return {
    propertyId: values.propertyId,
    category: values.category,
    priority: mapMaintenancePriorityToApi(values.priority),
    title: values.title,
    description: values.description,
  }
}

export function buildUpdateMaintenanceTicketPayload(
  values: MaintenanceCreateTicketFormValues,
): UpdateMaintenanceTicketPayload {
  return {
    propertyId: values.propertyId,
    category: values.category,
    priority: mapMaintenancePriorityToApi(values.priority),
    title: values.title,
    description: values.description,
  }
}
