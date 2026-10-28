import type { AgendaEventKind } from './agenda-event'

export interface AgendaScheduleChanges {
  start?: Date
  durationMinutes?: number
  responsibleId?: string
  type?: AgendaEventKind | null
  outsideBusinessHoursConfirmed?: boolean
}
