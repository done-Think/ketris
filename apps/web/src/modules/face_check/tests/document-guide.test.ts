import { describe, expect, it } from 'vitest'
import { documentGuideCrop } from '../utils/document-guide'

describe('document camera guide', () => {
  it('crops the centered landscape document from a widescreen webcam', () => {
    const crop = documentGuideCrop('landscape', 16 / 9)
    expect(crop.x).toBeCloseTo(0.1338125)
    expect(crop.y).toBeCloseTo(0.08)
    expect(crop.width).toBeCloseTo(0.732375)
    expect(crop.height).toBeCloseTo(0.84)
  })

  it.each(['landscape', 'portrait'] as const)(
    'keeps the entire %s guide inside a rotated phone frame',
    (orientation) => {
      const crop = documentGuideCrop(orientation, 9 / 16)
      expect(crop.x).toBeGreaterThanOrEqual(0)
      expect(crop.y).toBeGreaterThanOrEqual(0)
      expect(crop.x + crop.width).toBeLessThanOrEqual(1)
      expect(crop.y + crop.height).toBeLessThanOrEqual(1)
      expect((crop.width * (9 / 16)) / crop.height).toBeCloseTo(
        orientation === 'portrait' ? 1 / 1.55 : 1.55,
      )
    },
  )
})
