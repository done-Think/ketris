import {
  calendarMonthDateRange,
  calendarMonthInTimeZone,
  monthBoundsInTimeZone,
} from '@server/shared/time-zone-calendar'
import type { TimeRange } from '@server/shared/types/time-zone-calendar'

export function currentMonthRange(referenceDate: Date): TimeRange {
  return monthBoundsInTimeZone(referenceDate)
}

export function previousMonthRange(referenceDate: Date): TimeRange {
  const current = currentMonthRange(referenceDate)

  return monthBoundsInTimeZone(new Date(current.start.getTime() - 1))
}

export function previousMonthSamePeriodRange(referenceDate: Date): TimeRange {
  const previousMonth = previousMonthRange(referenceDate)
  const elapsed = referenceDate.getTime() - currentMonthRange(referenceDate).start.getTime()
  const end = new Date(
    Math.min(previousMonth.start.getTime() + elapsed, previousMonth.end.getTime()),
  )

  return { start: previousMonth.start, end }
}

export function previousMonthDueDateRange(referenceDate: Date): TimeRange {
  return calendarMonthDateRange(calendarMonthInTimeZone(referenceDate), -1)
}
