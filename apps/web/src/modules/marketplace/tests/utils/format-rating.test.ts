import { describe, expect, it } from 'vitest'

import { formatRating } from '../../utils/format-rating'

describe('formatRating', () => {
  it('keeps marketplace ratings with one decimal and dot separator by default', () => {
    expect(formatRating(5)).toBe('5.0')
    expect(formatRating(4.95)).toBe('5.0')
  })

  it('accepts a locale argument for next-intl formatter integration', () => {
    expect(formatRating(4.9, 'en-US')).toBe('4.9')
  })
})
