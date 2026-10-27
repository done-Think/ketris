import { describe, expect, it } from 'vitest'

import { priceLimit } from '../../config/search-filters'
import {
  buildSearchHref,
  formatSearchCurrency,
  normalizeSearchText,
  parsePriceRange,
} from '../../utils/search'
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
      selectedSearch: { location: 'Jardins, São Paulo', propertyType: 'APARTAMENTO' },
      searchDraft: { location: '', propertyType: '' },
      priceRange: [2000, 8000],
    })

    expect(href).toEqual({
      pathname: '/properties',
      query: {
        location: 'Jardins, São Paulo',
        priceRange: '2000-8000',
        propertyType: 'APARTAMENTO',
      },
    })
  })

  it('prefers the typed location and drops unknown property types and the full price range', () => {
    const href = buildSearchHref({
      selectedSearch: { location: 'Moema, São Paulo', propertyType: 'Studio' },
      searchDraft: { location: '  Pinheiros ', propertyType: '' },
      priceRange: [priceLimit.min, priceLimit.max],
    })

    expect(href).toEqual({ pathname: '/properties', query: { location: 'Pinheiros' } })
  })

  it('adds the selected purpose to the search URL', () => {
    const href = buildSearchHref({
      selectedSearch: { location: '', propertyType: '' },
      searchDraft: { location: '', propertyType: '' },
      priceRange: [priceLimit.min, priceLimit.max],
      purpose: 'buy',
    })

    expect(href).toEqual({ pathname: '/properties', query: { purpose: 'buy' } })
  })

  it('parses only well formed price ranges inside the limits', () => {
    expect(parsePriceRange('2000-8000')).toEqual({ min: 2000, max: 8000 })
    expect(parsePriceRange(`${priceLimit.min}-${priceLimit.max}`)).toEqual({ min: null, max: null })
    expect(parsePriceRange('8000-2000')).toEqual({ min: 8000, max: null })
    expect(parsePriceRange('abc')).toEqual({ min: null, max: null })
    expect(parsePriceRange(undefined)).toEqual({ min: null, max: null })
  })
})
