// Platform metrics are monthly in the business time zone, never in the server's: on a UTC host a
// cancellation at 22:00 on the last day of the month (São Paulo) would otherwise fall into the
// next month.
export const PLATFORM_TIME_ZONE = 'America/Sao_Paulo'

export interface MonthBounds {
  // First instant of the month and of the next month, in the given time zone.
  start: Date
  end: Date
}

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

// How far the time zone's wall clock is ahead of UTC at a given instant, in milliseconds.
function offsetAt(instant: number, timeZone: string): number {
  const p = zonedParts(instant, timeZone)
  const wallClock = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second)

  return wallClock - Math.floor(instant / 1000) * 1000
}

// UTC instant of 00:00 on the first day of a month in the time zone (month may overflow).
function startOfZonedMonth(year: number, month: number, timeZone: string): Date {
  const wallClock = Date.UTC(year, month, 1)
  const firstGuess = wallClock - offsetAt(wallClock, timeZone)
  const corrected = wallClock - offsetAt(firstGuess, timeZone)

  return new Date(corrected)
}

export function monthBoundsInTimeZone(
  referenceDate: Date,
  timeZone: string = PLATFORM_TIME_ZONE,
): MonthBounds {
  const { year, month } = zonedParts(referenceDate.getTime(), timeZone)

  return {
    start: startOfZonedMonth(year, month, timeZone),
    end: startOfZonedMonth(year, month + 1, timeZone),
  }
}
