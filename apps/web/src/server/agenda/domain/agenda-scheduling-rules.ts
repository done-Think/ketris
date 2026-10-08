import { AgendaMinimumAdvanceNoticeError, AgendaOutsideBusinessHoursError } from './errors'

export const AGENDA_MINIMUM_ADVANCE_HOURS = 3
export const AGENDA_BUSINESS_HOURS_START = 8
export const AGENDA_BUSINESS_HOURS_END = 18
export const AGENDA_TIMEZONE = 'America/Sao_Paulo'

function minuteOfDayInTimeZone(date: Date, timeZone: string): number {
  const [hour, minute] = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
    .format(date)
    .split(':')
    .map(Number)

  return (hour % 24) * 60 + minute
}

export function assertWithinAgendaSchedulingWindow(start: Date, now: Date = new Date()): void {
  const minimumStart = new Date(now.getTime() + AGENDA_MINIMUM_ADVANCE_HOURS * 60 * 60_000)

  if (start.getTime() < minimumStart.getTime()) {
    throw new AgendaMinimumAdvanceNoticeError()
  }

  const minutes = minuteOfDayInTimeZone(start, AGENDA_TIMEZONE)

  if (minutes < AGENDA_BUSINESS_HOURS_START * 60 || minutes > AGENDA_BUSINESS_HOURS_END * 60) {
    throw new AgendaOutsideBusinessHoursError()
  }
}
