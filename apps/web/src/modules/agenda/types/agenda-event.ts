import type { Dayjs } from 'dayjs'
import type { Control } from 'react-hook-form'
import type { z } from 'zod'

import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

import type { buildAgendaEventFormSchema } from '../schemas/agenda-event-form-schema'
import type { AgendaOrganizationItem } from './agenda-organization'

export type AgendaEventStatus = 'Confirmada' | 'Pendente' | 'Reagendar'

export type AgendaEventTone = 'primary' | 'info' | 'warning'
export type AgendaEventAudience = 'LEGACY_TEAM' | 'ALL_AGENTS' | 'ASSIGNED_AGENT'
export interface AgendaAgentOption {
  id: string
  name: string
}

export type AgendaEventCreatorRole = 'colleague' | 'agency'

export type AgendaEventVisualKind = 'followUp' | 'inspection' | 'meeting' | 'signature' | 'visit'

export type AgendaEvent = {
  audience?: AgendaEventAudience
  internal?: boolean
  responsibleId?: string
  id: string
  scheduledDate: string
  time: string
  durationMinutes: number
  title: string
  property: string
  propertyHref: string
  propertyId: string | null
  apiKind: AgendaEventApiKind | null
  participant: string
  phone: string
  notes: string
  responsibleName?: string
  status: AgendaEventStatus
  tone: AgendaEventTone
  kind?: AgendaEventVisualKind
  createdBy?: string
  createdById?: string | null
  createdByRole?: AgendaEventCreatorRole
}

export type AgendaCalendarDay = {
  dateLabel: string
  dayLabel: string
  key: string
  monthLabel: string
  monthLongLabel: string
  today: boolean
}

export type AgendaWeekRange = {
  endLabel: string
  startLabel: string
}

export type AgendaTimeSlot = {
  label: string
  hour: number
}

export type AgendaEventToneStyle = {
  bgcolor: string
  borderColor: string
  color: string
}

export type AgendaEventCardProps = {
  lane?: number
  laneCount?: number
  event: AgendaEvent
  top: number
  height: number
  onSelect: (event: AgendaEvent) => void
}

export type AgendaCalendarCard = { id: string; top: number; height: number } & (
  { kind: 'event'; event: AgendaEvent } | { kind: 'organization'; item: AgendaOrganizationItem }
)

export type AgendaEventFormValues = z.infer<ReturnType<typeof buildAgendaEventFormSchema>>

export interface BuildAgendaEventFormSchemaOptions {
  unchangedScheduleDate?: string
  unchangedScheduleTime?: string
}

export type AgendaPropertyOption = {
  href: string
  id: string
  label: string
}

export type CancelAgendaEventDialogProps = {
  open: boolean
  isPending: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
}

export type AgendaEventFormFieldsProps = {
  canManageAudience?: boolean
  agentOptions?: AgendaAgentOption[]
  agentsLoading?: boolean
  agentsError?: boolean
  control: Control<AgendaEventFormValues>
  maxDate: string
  minDate: string
  propertyOptions: AgendaPropertyOption[]
}

export type AgendaEventDetailDialogProps = {
  canManageAudience?: boolean
  agentOptions?: AgendaAgentOption[]
  agentsLoading?: boolean
  agentsError?: boolean
  hidePrivateDetails?: boolean
  readOnly?: boolean
  event: AgendaEvent | null
  isDeleting: boolean
  isSaving: boolean
  maxDate: string
  minDate: string
  open: boolean
  onClose: () => void
  onDelete: () => Promise<boolean>
  onEdit: (values: AgendaEventFormValues) => Promise<boolean>
  propertyOptions: AgendaPropertyOption[]
}

export type AgendaEventFormDialogProps = {
  canManageAudience?: boolean
  agentOptions?: AgendaAgentOption[]
  agentsLoading?: boolean
  agentsError?: boolean
  initialValues?: Partial<AgendaEventFormValues>
  maxDate: string
  minDate: string
  onClose: () => void
  onCreate: (values: AgendaEventFormValues) => void
  open: boolean
  propertyOptions: AgendaPropertyOption[]
}

export type AgendaDashboardHeaderProps = {
  readOnly?: boolean
  disableNextWeek: boolean
  disablePreviousWeek: boolean
  notifications: DashboardNotificationItem[]
  onNewEvent: () => void
  onNextWeek: () => void
  onNotificationSelect: (notification: DashboardNotificationItem) => void
  onPreviousWeek: () => void
  weekRange: AgendaWeekRange
}

export type AgendaWeekCalendarProps = {
  organizationItems?: AgendaOrganizationItem[]
  days: AgendaCalendarDay[]
  events: AgendaEvent[]
  onSelectEvent: (event: AgendaEvent) => void
  timeSlots: AgendaTimeSlot[]
}

export type AgendaBuildNotificationsOptions = {
  events: AgendaEvent[]
  t: (key: string, values?: Record<string, string | number>) => string
  today: Dayjs
}

export type AgendaEventApiStatus = 'CONFIRMED' | 'PENDING' | 'RESCHEDULE' | 'CANCELLED'

export type AgendaEventApiKind =
  'VISIT' | 'FOLLOW_UP' | 'MEETING' | 'INSPECTION' | 'SIGNATURE' | 'OTHER'

export interface AgendaEventApi {
  audience?: AgendaEventAudience
  internal?: boolean
  responsibleName?: string
  id: string
  tenantId: string
  responsibleId: string
  createdById: string | null
  propertyId: string | null
  propertyReference: string | null
  title: string
  kind: AgendaEventApiKind | null
  status: AgendaEventApiStatus
  start: string
  end: string
  participantName: string
  participantPhone: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface AgendaEventResponse {
  event: AgendaEventApi
}

export type RenterAgendaEventApi = Pick<
  AgendaEventApi,
  'id' | 'propertyId' | 'propertyReference' | 'title' | 'kind' | 'status' | 'start' | 'end'
> & {
  responsibleName: string
}

export type AgendaEventReadApi = AgendaEventApi | RenterAgendaEventApi

export interface AgendaEventsResponse {
  events: AgendaEventReadApi[]
}

export interface CreateAgendaEventPayload {
  outsideBusinessHoursConfirmed?: boolean
  audience?: AgendaEventAudience
  internal?: boolean
  responsibleId?: string
  propertyId?: string
  propertyReference?: string
  title: string
  kind?: AgendaEventApiKind
  start: string
  durationMinutes: number
  participantName: string
  participantPhone: string
  notes?: string
}

export interface RescheduleAgendaEventPayload {
  outsideBusinessHoursConfirmed?: boolean
  start: string
  durationMinutes?: number
}

export interface UpdateAgendaEventPayload {
  outsideBusinessHoursConfirmed?: boolean
  start?: string
  durationMinutes?: number
  audience?: AgendaEventAudience
  internal?: boolean
  responsibleId?: string
  title?: string
  kind?: AgendaEventApiKind | null
  status?: AgendaEventApiStatus
  propertyId?: string | null
  propertyReference?: string | null
  participantName?: string
  participantPhone?: string
  notes?: string | null
}
