import type { AgendaEventKind } from './agenda-event'

export interface AgendaScheduleChanges {
  inicio?: Date
  durationMinutes?: number
  responsavelId?: string
  tipo?: AgendaEventKind | null
  outsideBusinessHoursConfirmed?: boolean
}
