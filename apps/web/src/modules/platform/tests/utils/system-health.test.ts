import { describe, expect, it } from 'vitest'

import { splitUptime } from '../../utils/system-health'

describe('splitUptime', () => {
  it('splits seconds into days, hours and minutes', () => {
    expect(splitUptime(0)).toEqual({ days: 0, hours: 0, minutes: 0 })
    expect(splitUptime(59)).toEqual({ days: 0, hours: 0, minutes: 0 })
    expect(splitUptime(2 * 3600 + 15 * 60 + 30)).toEqual({ days: 0, hours: 2, minutes: 15 })
    expect(splitUptime(3 * 86_400 + 4 * 3600 + 59)).toEqual({ days: 3, hours: 4, minutes: 0 })
  })
})
