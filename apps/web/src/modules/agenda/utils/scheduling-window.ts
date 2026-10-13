import dayjs from 'dayjs'

export const AGENDA_MINIMUM_ADVANCE_HOURS = 3
export const AGENDA_BUSINESS_HOURS_START = 8
export const AGENDA_BUSINESS_HOURS_END = 18

function minuteOfDay(date: dayjs.Dayjs): number {
  return date.hour() * 60 + date.minute()
}

export function meetsMinimumAdvanceNotice(date: dayjs.Dayjs, now: dayjs.Dayjs = dayjs()): boolean {
  return date.diff(now, 'minute') >= AGENDA_MINIMUM_ADVANCE_HOURS * 60
}

export function isWithinBusinessHours(date: dayjs.Dayjs): boolean {
  const minutes = minuteOfDay(date)
  return minutes >= AGENDA_BUSINESS_HOURS_START * 60 && minutes <= AGENDA_BUSINESS_HOURS_END * 60
}

function roundUpToNextQuarterHour(date: dayjs.Dayjs): dayjs.Dayjs {
  const remainder = date.minute() % 15
  const rounded = remainder === 0 ? date : date.add(15 - remainder, 'minute')
  return rounded.second(0).millisecond(0)
}

export function computeEarliestSchedulableSlot(now: dayjs.Dayjs = dayjs()): dayjs.Dayjs {
  const candidate = roundUpToNextQuarterHour(now.add(AGENDA_MINIMUM_ADVANCE_HOURS, 'hour'))
  const minutes = minuteOfDay(candidate)

  if (minutes < AGENDA_BUSINESS_HOURS_START * 60) {
    return candidate.hour(AGENDA_BUSINESS_HOURS_START).minute(0).second(0).millisecond(0)
  }

  if (minutes > AGENDA_BUSINESS_HOURS_END * 60) {
    return candidate
      .add(1, 'day')
      .hour(AGENDA_BUSINESS_HOURS_START)
      .minute(0)
      .second(0)
      .millisecond(0)
  }

  return candidate
}
