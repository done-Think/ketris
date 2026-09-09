import type { z } from 'zod'

import type {
  agendaEventFormSchema,
  agendaRescheduleSchema,
} from '../schemas/agenda-reschedule-schema'

export type AgendaEventStatus = 'Confirmada' | 'Pendente' | 'Reagendar'

export type AgendaEventTone = 'primary' | 'info' | 'warning'

export type AgendaEventCreatorRole = 'Colega' | 'Imobiliária'

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
  createdBy?: string
  createdByRole?: AgendaEventCreatorRole
}

export type AgendaCalendarDay = {
  dateLabel: string
  dayLabel: string
  key: string
  monthLabel: string
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

export type AgendaTimelineProps = {
  days: AgendaCalendarDay[]
  events: AgendaEvent[]
  onEventSelect: (event: AgendaEvent) => void
}
