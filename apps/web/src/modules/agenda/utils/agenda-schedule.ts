import type { AgendaSchedule } from '../types/agenda-schedule'

export function sameAgendaPeriod(first: AgendaSchedule, second?: AgendaSchedule | null) {
  return (
    first.scheduledDate === second?.scheduledDate &&
    first.scheduledTime === second.scheduledTime &&
    first.durationMinutes === second.durationMinutes
  )
}

export function agendaPeriod(values: AgendaSchedule): AgendaSchedule {
  return {
    scheduledDate: values.scheduledDate,
    scheduledTime: values.scheduledTime,
    durationMinutes: values.durationMinutes,
  }
}
