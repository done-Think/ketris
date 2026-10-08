import { describe, expect, it } from 'vitest'

import { buildSearchHref, formatSearchCurrency, normalizeSearchText } from '../../utils/search'
import { formatPropertyArea } from '../../utils/property-presentation'

describe('marketplace search utils', () => {
  it('normalizes accents and casing for search filtering', () => {
    expect(normalizeSearchText('Jardins, São Paulo')).toBe('jardins, sao paulo')
  })

  it('formats price values as BRL without cents', () => {
    expect(formatSearchCurrency(10000).replace(/\s/, ' ')).toBe('R$ 10.000')
    expect(formatSearchCurrency(10000, 'en-US')).toContain('10,000')
    expect(formatSearchCurrency(10000, 'es-ES')).toContain('10.000')
  })

  it('formats fractional areas according to the active locale', () => {
    expect(formatPropertyArea(95.5, 'pt-BR')).toBe('95,5 m²')
    expect(formatPropertyArea(95.5, 'en-US')).toBe('95.5 m²')
    expect(formatPropertyArea(95.5, 'es-ES')).toBe('95,5 m²')
  })

  it('builds a public property search URL from selected filters', () => {
    const href = buildSearchHref({
      selectedSearch: {
        location: 'Jardins, São Paulo',
        propertyType: 'Apartamento',
        priceRange: '0-10000',
      },
      searchDraft: {
        location: '',
        propertyType: 'Studio',
      },
      priceRange: [0, 10000],
    })

    expect(href).toEqual({
      pathname: '/properties',
      query: {
        location: 'Jardins, São Paulo',
        priceRange: '0-10000',
        propertyType: 'Studio',
      },
    })
  })
})
