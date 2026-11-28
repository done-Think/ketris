import dayjs from 'dayjs'
import {
  AGENDA_MINIMUM_ADVANCE_HOURS,
  AGENDA_TIME_SLOT_MINUTES,
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

function roundUpToNextHalfHour(date: dayjs.Dayjs): dayjs.Dayjs {
  const remainder = date.minute() % AGENDA_TIME_SLOT_MINUTES
  const isExactSlot = remainder === 0 && date.second() === 0 && date.millisecond() === 0
  const rounded = isExactSlot ? date : date.add(AGENDA_TIME_SLOT_MINUTES - remainder, 'minute')
  return rounded.second(0).millisecond(0)
}

export function computeEarliestSchedulableSlot(now: dayjs.Dayjs = dayjs()): dayjs.Dayjs {
  return roundUpToNextHalfHour(now.add(AGENDA_MINIMUM_ADVANCE_HOURS, 'hour'))
}
