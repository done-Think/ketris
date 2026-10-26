import type { ReactNode } from 'react'

import type { MaintenanceCategory } from '@shared/lib/utils/maintenance-categories'
import type { ApiMaintenanceTicket, MaintenanceAction, MaintenancePermissions } from './service'

export type MaintenancePriority = 'urgent' | 'high' | 'normal'

export type MaintenanceTicketFormValues = {
  contractId?: string
  propertyId?: string
  category: MaintenanceCategory | ''
  priority: MaintenancePriority
  title: string
  description: string
}

export type MaintenanceCreateTicketFormValues = Omit<MaintenanceTicketFormValues, 'category'> & {
  category: MaintenanceCategory
}

export type MaintenanceCreateTicketDialogProps = {
  open: boolean
  onClose: () => void
  onCreate: (values: MaintenanceCreateTicketFormValues) => Promise<boolean | void> | void
  initialValues?: MaintenanceTicketFormValues
  mode?: 'create' | 'edit'
  loadError?: boolean
  onRetry?: () => void
}

export type MaintenanceStatus =
  'inProgress' | 'open' | 'pendingConfirmation' | 'contested' | 'cancelled' | 'resolved' | 'closed'

export interface MaintenanceTicket {
  permissions?: import('./service').MaintenancePermissions
  id: string
  propertyId: string
  property: string
  category: MaintenanceCategory
  priority: MaintenancePriority
  tenant: string
  openedAt: string
  status: MaintenanceStatus
  title?: string
  description?: string
}

export interface MaintenanceMetric {
  label: 'open' | 'urgent' | 'averageResolution'
  value: string
}

export interface MaintenanceFilter {
  value: 'all' | MaintenanceStatus | 'urgent'
  count: number
}

export type MaintenanceStatusFiltersProps = {
  activeFilter: MaintenanceFilter['value']
  direction?: 'row' | 'column'
  getFilterCount: (value: MaintenanceFilter['value']) => number
  isDesktop?: boolean
  onChange: (value: MaintenanceFilter['value']) => void
}

export type MaintenanceFilterOptionLabelProps = {
  active: boolean
  count: number
  label: string
}

export type MetricCardProps = {
  label: string
  value: string
  tone: 'open' | 'urgent' | 'averageResolution'
}

export interface MaintenanceStatusStyle {
  bgcolor: string
  color: string
}

export interface MaintenanceTicketDetailPageProps {
  ticketId: string
}

export interface MaintenanceLinksDialogProps {
  open: boolean
  onClose: () => void
}

export interface MaintenanceWorkflowControlsProps {
  ticket: ApiMaintenanceTicket
}

export interface MaintenanceScheduleProps {
  ticket: ApiMaintenanceTicket
}

export interface MaintenanceScheduleFormValues {
  scheduledDate: string
  scheduledHour: string
  scheduledMinute: string
}

export interface MaintenanceWorkflowSelection {
  action: MaintenanceWorkflowAction
  requestId?: string
}

export interface MaintenanceWorkflowControl {
  permission: keyof MaintenancePermissions
  action: MaintenanceWorkflowAction
  icon: ReactNode
}

export type MaintenanceWorkflowAction = Exclude<MaintenanceAction['action'], 'schedule'>
