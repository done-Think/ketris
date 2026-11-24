import { describe, expect, it } from 'vitest'

import { brand, surface } from '@shared/theme/tokens'

import { findBrandContrastIssues } from '../../utils/brand-color-contrast'
import { sampleLogoColors, suggestPaletteFromLogoColors } from '../../utils/logo-palette'

function pixels(...colors: Array<[number, number, number, number, number]>) {
  const data: number[] = []
  for (const [red, green, blue, alpha, count] of colors) {
    for (let index = 0; index < count; index += 1) data.push(red, green, blue, alpha)
  }
  return new Uint8ClampedArray(data)
}

describe('logo palette', () => {
  it('ignores transparent pixels and groups close colors', () => {
    const samples = sampleLogoColors(
      pixels([11, 107, 203, 255, 10], [12, 108, 204, 255, 10], [255, 0, 0, 0, 50]),
    )

    expect(samples).toHaveLength(1)
    expect(samples[0]).toMatchObject({ count: 20, hex: '#0C6CCC' })
  })

  it('suggests the vivid logo color as accent and the dark one as name color', () => {
    const palette = suggestPaletteFromLogoColors(
      sampleLogoColors(
        pixels([11, 107, 203, 255, 60], [10, 37, 64, 255, 30], [255, 255, 255, 255, 40]),
      ),
    )

    expect(palette).toEqual({
      backgroundColor: surface.paper,
      primaryColor: '#0B6BCB',
      secondaryColor: '#0A2540',
    })
    expect(findBrandContrastIssues(palette!)).toEqual([])
  })

  it('skips accent colors that would make white button text unreadable', () => {
    const palette = suggestPaletteFromLogoColors(
      sampleLogoColors(pixels([255, 225, 77, 255, 80], [27, 127, 59, 255, 20])),
    )

    expect(palette?.primaryColor).toBe('#1B7F3B')
  })

  it('falls back to the Ketris graphite when the logo has a single dark color', () => {
    const palette = suggestPaletteFromLogoColors(sampleLogoColors(pixels([20, 20, 20, 255, 50])))

    expect(palette).toEqual({
      backgroundColor: surface.paper,
      primaryColor: '#141414',
      secondaryColor: brand.graphite[500],
    })
  })

  it('returns no suggestion for a logo without usable colors', () => {
    expect(suggestPaletteFromLogoColors(sampleLogoColors(pixels([250, 250, 250, 255, 50])))).toBe(
      null,
    )
    expect(suggestPaletteFromLogoColors([])).toBe(null)
  })
})
