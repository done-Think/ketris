import dayjs from 'dayjs'
import {
  AGENDA_MINIMUM_ADVANCE_HOURS,
  isAgendaPeriodWithinBusinessHours,
} from '@shared/lib/utils/agenda-scheduling'

export function meetsMinimumAdvanceNotice(date: dayjs.Dayjs, now: dayjs.Dayjs = dayjs()): boolean {
  return date.diff(now, 'millisecond') >= AGENDA_MINIMUM_ADVANCE_HOURS * 3600000
}
export function isWithinBusinessHours(date: dayjs.Dayjs, durationMinutes = 0): boolean {
  return isAgendaPeriodWithinBusinessHours(
    date.toDate(),
    date.add(durationMinutes, 'minute').toDate(),
  )
}

function roundUpToNextQuarterHour(date: dayjs.Dayjs): dayjs.Dayjs {
  const remainder = date.minute() % 15
  const isExactQuarterHour = remainder === 0 && date.second() === 0 && date.millisecond() === 0
  const rounded = isExactQuarterHour ? date : date.add(15 - remainder, 'minute')
  return rounded.second(0).millisecond(0)
}

export function computeEarliestSchedulableSlot(now: dayjs.Dayjs = dayjs()): dayjs.Dayjs {
  return roundUpToNextQuarterHour(now.add(AGENDA_MINIMUM_ADVANCE_HOURS, 'hour'))
}
