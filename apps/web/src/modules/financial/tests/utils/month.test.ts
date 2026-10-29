import { describe, expect, it } from 'vitest'

import { calendarDate, monthDate, monthKey, recentMonths } from '../../utils/month'

describe('month utils', () => {
  it('builds the month key from a local date', () => {
    expect(monthKey(new Date(2026, 0, 31))).toBe('2026-01')
  })

  it('lists recent months, newest first, across the year boundary', () => {
    expect(recentMonths(new Date(2026, 1, 15), 4)).toEqual([
      '2026-02',
      '2026-01',
      '2025-12',
      '2025-11',
    ])
  })

  it('parses month and calendar dates at noon UTC to avoid day shifts', () => {
    expect(monthDate('2026-10').toISOString()).toBe('2026-10-01T12:00:00.000Z')
    expect(calendarDate('2026-10-31T00:00:00.000Z').toISOString()).toBe('2026-10-31T12:00:00.000Z')
  })
})
