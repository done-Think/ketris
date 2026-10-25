import type {
  AgendaEventResponseDTO,
  RenterAgendaEventResponseDTO,
  AgendaEventsResponseDTO,
  CreateAgendaEventRequestInput,
  RescheduleAgendaEventRequestInput,
  UpdateAgendaEventRequestInput,
} from '@server/agenda/types/http'
import type { LocalizedHref } from '@shared/types/localized-href'
import type { Dayjs } from 'dayjs'
import type { Control } from 'react-hook-form'
import type { z } from 'zod'

import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

import type { buildAgendaEventFormSchema } from '../schemas/agenda-event-form-schema'
import type { AgendaOrganizationItem } from './agenda-organization'

export type AgendaEventStatus = AgendaEventResponseDTO['status']

export type AgendaEventTone = 'primary' | 'info' | 'warning'
export type AgendaEventAudience = AgendaEventResponseDTO['audience']
export interface AgendaAgentOption {
  id: string
  name: string
}

export type AgendaEventCreatorRole = NonNullable<AgendaEventResponseDTO['createdBy']>['role']

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
  propertyHref: LocalizedHref
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
  href: LocalizedHref
  id: string
  label: string
}

export type CancelAgendaEventDialogProps = {
  open: boolean
  isPending: boolean
  title: string
  onClose: () => void
  onConfirm: (values: CancelAgendaEventValues) => void | Promise<void>
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
  onDelete: (reason: string) => Promise<boolean>
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
  currentUserId?: string
  events: AgendaEvent[]
  t: (key: string, values?: Record<string, string | number>) => string
  today: Dayjs
}

export type AgendaEventApiStatus = AgendaEventResponseDTO['status']
export type AgendaEventApiKind = NonNullable<AgendaEventResponseDTO['kind']>
export type AgendaEventApi = AgendaEventResponseDTO
export type AgendaEventResponse = { event: AgendaEventResponseDTO }
export type RenterAgendaEventApi = RenterAgendaEventResponseDTO
export type AgendaEventReadApi = AgendaEventsResponseDTO['events'][number]
export type AgendaEventsResponse = AgendaEventsResponseDTO
export type CreateAgendaEventPayload = Omit<CreateAgendaEventRequestInput, 'start'> & {
  start: string
}
export type RescheduleAgendaEventPayload = Omit<RescheduleAgendaEventRequestInput, 'start'> & {
  start: string
}
export type UpdateAgendaEventPayload = Omit<UpdateAgendaEventRequestInput, 'start'> & {
  start?: string
}

export type CancelAgendaEventValues = z.infer<
  ReturnType<typeof import('../schemas/cancel-agenda-event-schema').buildCancelAgendaEventSchema>
>
export type CancelAgendaEventPayload =
  import('@server/agenda/types/http').CancelAgendaEventRequestDTO
export interface CancelAgendaEventMutationInput {
  id: string
  payload: CancelAgendaEventPayload
}
export interface AgendaLayoutPlacement {
  id: string
  top: number
  height: number
}
export type AgendaLaidOutCard<T extends AgendaLayoutPlacement = AgendaCalendarCard> = T & {
  lane: number
  laneCount: number
}

export interface AgendaPropertyFieldProps {
  control: Control<AgendaEventFormValues>
  internal: boolean
  propertyOptions: AgendaPropertyOption[]
}

export interface AgendaEventMutationInput<TPayload> {
  id: string
  payload: TPayload
}
