import type { Dayjs } from 'dayjs'
import type { z } from 'zod'

import type { agendaEventFormSchema } from '../schemas/agenda-event-form-schema'
import type { agendaRescheduleSchema } from '../schemas/agenda-reschedule-schema'

export type AgendaEventStatus = 'Confirmada' | 'Pendente' | 'Reagendar'

export type AgendaEventTone = 'primary' | 'info' | 'warning'

export type AgendaEventCreatorRole = 'agency' | 'colleague'

export type AgendaEventKind = 'visit' | 'followUp' | 'meeting' | 'inspection' | 'signature'

export type AgendaTranslationGetter = (
  key: string,
  values?: Record<string, string | number>,
) => string

export type AgendaEvent = {
  id: string
  scheduledDate: string
  time: string
  durationMinutes: number
  title: string
  property: string
  propertyHref: string
  participant: string
  phone: string
  notes: string
  status: AgendaEventStatus
  tone: AgendaEventTone
  kind: AgendaEventKind
  createdBy?: string
  createdByRole?: AgendaEventCreatorRole
}

export type AgendaEventSeed = Omit<AgendaEvent, 'notes' | 'participant' | 'property' | 'title'> & {
  notesKey: string
  participant: string
  propertyKey: string
  titleKey: string
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
  event: AgendaEvent
  top: number
  height: number
  onSelect: (event: AgendaEvent) => void
}

export type AgendaEventFormValues = z.infer<typeof agendaEventFormSchema>

export type AgendaPropertyOption = {
  href: string
  id: string
  label: string
}

export type AgendaRescheduleFormValues = z.infer<typeof agendaRescheduleSchema>

export type AgendaEventDetailDialogProps = {
  event: AgendaEvent | null
  eventDate: string
  maxDate: string
  minDate: string
  open: boolean
  onClose: () => void
  onReschedule: (values: AgendaRescheduleFormValues) => void
}

export type AgendaEventFormDialogProps = {
  maxDate: string
  minDate: string
  onClose: () => void
  onCreate: (values: AgendaEventFormValues) => void
  open: boolean
  propertyOptions: AgendaPropertyOption[]
}

export type AgendaDashboardHeaderProps = {
  disableNextWeek: boolean
  disablePreviousWeek: boolean
  notificationCount: number
  notificationsExpanded: boolean
  onNewEvent: () => void
  onNextWeek: () => void
  onOpenNotifications: (anchorEl: HTMLButtonElement) => void
  onPreviousWeek: () => void
  weekRange: AgendaWeekRange
}

export type AgendaWeekCalendarProps = {
  days: AgendaCalendarDay[]
  events: AgendaEvent[]
  onSelectEvent: (event: AgendaEvent) => void
  timeSlots: AgendaTimeSlot[]
}

export type AgendaNotification = {
  event: AgendaEvent
  id: string
  kind: 'assignedEvent' | 'todayVisit'
  message: string
  title: string
}

export type AgendaNotificationsPopoverProps = {
  anchorEl: HTMLButtonElement | null
  notifications: AgendaNotification[]
  onClose: () => void
  onSelectNotification: (event: AgendaEvent) => void
}

export type AgendaBuildNotificationsOptions = {
  events: AgendaEvent[]
  t: AgendaTranslationGetter
  today: Dayjs
}
