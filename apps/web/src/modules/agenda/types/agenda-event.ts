import type { Dayjs } from 'dayjs'
import type { z } from 'zod'

import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

import type { agendaEventFormSchema } from '../schemas/agenda-event-form-schema'
import type { agendaRescheduleSchema } from '../schemas/agenda-reschedule-schema'

export type AgendaEventStatus = 'Confirmada' | 'Pendente' | 'Reagendar'

export type AgendaEventTone = 'primary' | 'info' | 'warning'

export type AgendaEventCreatorRole = 'colleague' | 'agency'

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
  kind?: 'followUp' | 'inspection' | 'meeting' | 'signature' | 'visit'
  createdBy?: string
  createdByRole?: AgendaEventCreatorRole
}

export type AgendaTranslationGetter = (key: string) => string

export type AgendaEventSeed = Omit<AgendaEvent, 'notes' | 'property' | 'title'> & {
  notesKey: string
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
  notifications: DashboardNotificationItem[]
  onNewEvent: () => void
  onNextWeek: () => void
  onNotificationSelect: (notification: DashboardNotificationItem) => void
  onPreviousWeek: () => void
  weekRange: AgendaWeekRange
}

export type AgendaWeekCalendarProps = {
  days: AgendaCalendarDay[]
  events: AgendaEvent[]
  onSelectEvent: (event: AgendaEvent) => void
  timeSlots: AgendaTimeSlot[]
}

export type AgendaMobileDayListProps = {
  days: AgendaCalendarDay[]
  events: AgendaEvent[]
  onSelectDay: (dayKey: string) => void
  onSelectEvent: (event: AgendaEvent) => void
  selectedDayKey: string
}

export type AgendaBuildNotificationsOptions = {
  events: AgendaEvent[]
  t: (key: string, values?: Record<string, string | number>) => string
  today: Dayjs
}
