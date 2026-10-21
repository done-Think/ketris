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
export function computeEarliestSchedulableSlot(now: dayjs.Dayjs = dayjs()): dayjs.Dayjs {
  const candidate = now.add(AGENDA_MINIMUM_ADVANCE_HOURS, 'hour')
  const extra = candidate.minute() % 15 || candidate.second() || candidate.millisecond()
  return candidate
    .add(extra ? 15 - (candidate.minute() % 15) : 0, 'minute')
    .second(0)
    .millisecond(0)
}
