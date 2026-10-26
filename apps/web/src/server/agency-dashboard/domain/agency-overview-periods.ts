import {
  calendarMonthDateRange,
  calendarMonthInTimeZone,
  monthBoundsInTimeZone,
} from '@server/shared/time-zone-calendar'
import type { TimeRange } from '@server/shared/types/time-zone-calendar'

// Months follow the business time zone (America/Sao_Paulo), not the server's: on a UTC host the
// month would otherwise turn at 21:00 on its last day.
export function currentMonthRange(referenceDate: Date): TimeRange {
  return monthBoundsInTimeZone(referenceDate)
}

export function previousMonthRange(referenceDate: Date): TimeRange {
  const current = currentMonthRange(referenceDate)

  return monthBoundsInTimeZone(new Date(current.start.getTime() - 1))
}

// Same elapsed time into the previous month (e.g. Oct 1–13 14:00 → Sep 1–13 14:00), capped at the
// end of the previous month so a partial month is never compared against a full one.
export function previousMonthSamePeriodRange(referenceDate: Date): TimeRange {
  const previousMonth = previousMonthRange(referenceDate)
  const elapsed = referenceDate.getTime() - currentMonthRange(referenceDate).start.getTime()
  const end = new Date(
    Math.min(previousMonth.start.getTime() + elapsed, previousMonth.end.getTime()),
  )

  return { start: previousMonth.start, end }
}

// Due dates are date-only (stored at 00:00 UTC): the previous month is the one before São Paulo's
// current month, compared as calendar dates.
export function previousMonthDueDateRange(referenceDate: Date): TimeRange {
  return calendarMonthDateRange(calendarMonthInTimeZone(referenceDate), -1)
}
