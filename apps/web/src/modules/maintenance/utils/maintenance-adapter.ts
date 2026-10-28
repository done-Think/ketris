import { formatDate } from '@shared/lib/utils/format'
import dayjs from 'dayjs'
import type { MaintenanceDateFormatter } from '../types/formatters'

import type {
  MaintenanceCreateTicketFormValues,
  MaintenanceTicketFormValues,
  MaintenancePriority,
  MaintenanceScheduleFormValues,
  MaintenanceStatus,
  MaintenanceTicket,
} from '../types/maintenance'
import type {
  ApiMaintenanceTicket,
  ApiMaintenanceTicketListItem,
  ApiMaintenanceTicketPriority,
  ApiMaintenanceTicketStatus,
  CreateMaintenanceTicketPayload,
  MaintenanceAction,
  UpdateMaintenanceTicketPayload,
} from '../types/service'

export const maintenanceStatusFromApiMap: Record<ApiMaintenanceTicketStatus, MaintenanceStatus> = {
  OPEN: 'open',
  IN_PROGRESS: 'inProgress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  AWAITING_CONFIRMATION: 'pendingConfirmation',
  DISPUTED: 'contested',
  CANCELED: 'cancelled',
}

const statusToApiMap: Record<MaintenanceStatus, ApiMaintenanceTicketStatus> = {
  open: 'OPEN',
  inProgress: 'IN_PROGRESS',
  resolved: 'RESOLVED',
  closed: 'CLOSED',
  pendingConfirmation: 'AWAITING_CONFIRMATION',
  contested: 'DISPUTED',
  cancelled: 'CANCELED',
}

const priorityFromApiMap: Record<ApiMaintenanceTicketPriority, MaintenancePriority> = {
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
}

const priorityToApiMap: Record<MaintenancePriority, ApiMaintenanceTicketPriority> = {
  normal: 'NORMAL',
  high: 'HIGH',
  urgent: 'URGENT',
}

export function mapMaintenanceStatusFromApi(status: ApiMaintenanceTicketStatus): MaintenanceStatus {
  return maintenanceStatusFromApiMap[status]
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
  format: MaintenanceDateFormatter = formatDate,
): MaintenanceTicket {
  return {
    id: item.id,
    permissions: item.permissions,
    propertyId: item.propertyId,
    property: item.propertyTitle,
    category: item.category,
    priority: mapMaintenancePriorityFromApi(item.priority),
    tenant: item.openedByName,
    openedAt: format(item.createdAt),
    status: mapMaintenanceStatusFromApi(item.status),
    title: item.title,
  }
}

export function mapMaintenanceTicketFromApi(
  ticket: ApiMaintenanceTicket,
  format: MaintenanceDateFormatter = formatDate,
): MaintenanceTicket {
  return {
    id: ticket.id,
    propertyId: ticket.propertyId,
    property: ticket.propertyTitle,
    category: ticket.category,
    priority: mapMaintenancePriorityFromApi(ticket.priority),
    tenant: ticket.openedByName,
    openedAt: format(ticket.createdAt),
    status: mapMaintenanceStatusFromApi(ticket.status),
    title: ticket.title,
    description: ticket.description,
  }
}

export function mapMaintenanceTicketToFormValues(
  ticket: ApiMaintenanceTicket,
): MaintenanceTicketFormValues {
  return {
    contractId: ticket.contractId ?? '',
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
    contractId: values.contractId ?? '',
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
    contractId: values.contractId || undefined,
    category: values.category,
    priority: mapMaintenancePriorityToApi(values.priority),
    title: values.title,
    description: values.description,
  }
}

export function mapMaintenanceScheduleToFormValues(
  ticket: Pick<ApiMaintenanceTicket, 'scheduledAt'>,
): MaintenanceScheduleFormValues {
  return {
    scheduledDate: ticket.scheduledAt ? dayjs(ticket.scheduledAt).format('YYYY-MM-DD') : '',
    scheduledHour: ticket.scheduledAt ? dayjs(ticket.scheduledAt).format('HH') : '',
    scheduledMinute: ticket.scheduledAt ? dayjs(ticket.scheduledAt).format('mm') : '',
  }
}

export function buildMaintenanceScheduleAction(
  values: MaintenanceScheduleFormValues,
): Extract<MaintenanceAction, { action: 'schedule' }> {
  return {
    action: 'schedule',
    scheduledAt: new Date(
      `${values.scheduledDate}T${values.scheduledHour}:${values.scheduledMinute}`,
    ).toISOString(),
  }
}
