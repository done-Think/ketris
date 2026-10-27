import type { CalendarMonth, TimeRange } from './types/time-zone-calendar'

export const BUSINESS_TIME_ZONE = 'America/Sao_Paulo'

function zonedParts(instant: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
      .formatToParts(new Date(instant))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  )

  return {
    year: parts.year,
    month: parts.month - 1,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  }
}

function offsetAt(instant: number, timeZone: string): number {
  const p = zonedParts(instant, timeZone)
  const wallClock = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second)

  return wallClock - Math.floor(instant / 1000) * 1000
}

function startOfZonedDay(year: number, month: number, day: number, timeZone: string): Date {
  const wallClock = Date.UTC(year, month, day)
  const firstGuess = wallClock - offsetAt(wallClock, timeZone)
  const corrected = wallClock - offsetAt(firstGuess, timeZone)

  return new Date(corrected)
}

export function monthBoundsInTimeZone(
  referenceDate: Date,
  timeZone: string = BUSINESS_TIME_ZONE,
): TimeRange {
  const { year, month } = zonedParts(referenceDate.getTime(), timeZone)

  return {
    start: startOfZonedDay(year, month, 1, timeZone),
    end: startOfZonedDay(year, month + 1, 1, timeZone),
  }
}

export function dayBoundsInTimeZone(
  referenceDate: Date,
  timeZone: string = BUSINESS_TIME_ZONE,
): TimeRange {
  const { year, month, day } = zonedParts(referenceDate.getTime(), timeZone)

  return {
    start: startOfZonedDay(year, month, day, timeZone),
    end: startOfZonedDay(year, month, day + 1, timeZone),
  }
}

export function calendarMonthInTimeZone(
  referenceDate: Date,
  timeZone: string = BUSINESS_TIME_ZONE,
): CalendarMonth {
  const { year, month } = zonedParts(referenceDate.getTime(), timeZone)

  return { year, month }
}

export function calendarMonthDateRange({ year, month }: CalendarMonth, monthOffset = 0): TimeRange {
  return {
    start: new Date(Date.UTC(year, month + monthOffset, 1)),
    end: new Date(Date.UTC(year, month + monthOffset + 1, 1)),
  }
}

export function calendarDateInTimeZone(
  referenceDate: Date,
  timeZone: string = BUSINESS_TIME_ZONE,
): Date {
  const { year, month, day } = zonedParts(referenceDate.getTime(), timeZone)

  return new Date(Date.UTC(year, month, day))
}
