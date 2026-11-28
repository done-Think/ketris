import { describe, expect, it } from 'vitest'

import { agencyBrandPalettes } from '../../config/agency-brand-palettes'
import {
  contrastRatio,
  findBrandContrastIssues,
  isHexColor,
} from '../../utils/brand-color-contrast'

describe('brand color contrast', () => {
  it('accepts only six-digit hex colors', () => {
    expect(isHexColor('#A1b2C3')).toBe(true)
    expect(isHexColor('#FFF')).toBe(false)
    expect(isHexColor('')).toBe(false)
    expect(isHexColor('red')).toBe(false)
  })

  it('computes the WCAG ratio between black and white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
  })

  it('warns when the name is unreadable on the background and suggests a darker color', () => {
    const issues = findBrandContrastIssues({
      backgroundColor: '#FFFFFF',
      primaryColor: '#0B6BCB',
      secondaryColor: '#FFE14D',
    })

    expect(issues).toEqual([
      expect.objectContaining({ kind: 'nameOnBackground', suggestion: 'darker' }),
    ])
  })

  it('suggests a lighter name on a dark background', () => {
    const [issue] = findBrandContrastIssues({
      backgroundColor: '#212631',
      primaryColor: '#0B6BCB',
      secondaryColor: '#333333',
    })

    expect(issue).toMatchObject({ kind: 'nameOnBackground', suggestion: 'lighter' })
  })

  it('falls back to the accent color for the name when the name color is empty', () => {
    const issues = findBrandContrastIssues({
      backgroundColor: '#FFFFFF',
      primaryColor: '#FFE14D',
      secondaryColor: '',
    })

    expect(issues.map((issue) => issue.kind)).toEqual(['nameOnBackground', 'textOnPrimary'])
  })

  it('ignores empty or partial colors', () => {
    expect(
      findBrandContrastIssues({ backgroundColor: '', primaryColor: '#FF', secondaryColor: '' }),
    ).toEqual([])
  })

  it('keeps every ready-made palette free of contrast warnings', () => {
    for (const palette of agencyBrandPalettes) {
      expect(findBrandContrastIssues(palette), palette.id).toEqual([])
    }
  })
})
