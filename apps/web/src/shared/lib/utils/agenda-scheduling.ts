export const AGENDA_MINIMUM_ADVANCE_HOURS = 3
export const AGENDA_MINIMUM_VISIT_MINUTES = 30
export const AGENDA_BUSINESS_HOURS_START = 8
export const AGENDA_BUSINESS_HOURS_END = 18
export const AGENDA_TIMEZONE = 'America/Sao_Paulo'

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: AGENDA_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function localParts(date: Date) {
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  )
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    seconds: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second),
  }
}

export function isAgendaPeriodWithinBusinessHours(start: Date, end: Date): boolean {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start)
    return false
  const first = localParts(start)
  const last = localParts(end)
  return (
    first.day === last.day &&
    first.seconds >= AGENDA_BUSINESS_HOURS_START * 3600 &&
    last.seconds <= AGENDA_BUSINESS_HOURS_END * 3600
  )
}
