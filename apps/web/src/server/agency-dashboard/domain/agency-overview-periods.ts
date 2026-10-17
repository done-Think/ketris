export interface DateRange {
  start: Date
  end: Date
}

export function currentMonthRange(referenceDate: Date): DateRange {
  return {
    start: new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
    end: new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1),
  }
}

export function previousMonthRange(referenceDate: Date): DateRange {
  return {
    start: new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1),
    end: new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1),
  }
}

// Same elapsed time into the previous month (e.g. Oct 1–13 14:00 → Sep 1–13 14:00), capped at the
// end of the previous month so a partial month is never compared against a full one.
export function previousMonthSamePeriodRange(referenceDate: Date): DateRange {
  const previousMonth = previousMonthRange(referenceDate)
  const elapsed = referenceDate.getTime() - currentMonthRange(referenceDate).start.getTime()
  const end = new Date(
    Math.min(previousMonth.start.getTime() + elapsed, previousMonth.end.getTime()),
  )

  return { start: previousMonth.start, end }
}
