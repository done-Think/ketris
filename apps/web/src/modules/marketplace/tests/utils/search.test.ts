import { describe, expect, it } from 'vitest'

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
      selectedSearch: { location: 'São Paulo', propertyType: 'APARTMENT' },
      searchDraft: { location: '', propertyType: '' },
      priceRange: [2000, 8000],
    })

    expect(href).toEqual({
      pathname: '/properties',
      query: {
        city: 'São Paulo',
        priceRange: '2000-8000',
        propertyType: 'APARTMENT',
      },
    })
  })

  it('prefers the typed location and drops unknown types and empty price limits', () => {
    const href = buildSearchHref({
      selectedSearch: { location: 'Moema, São Paulo', propertyType: 'Studio' },
      searchDraft: { location: '  Pinheiros ', propertyType: '' },
      priceRange: [null, null],
    })

    expect(href).toEqual({ pathname: '/properties', query: { location: 'Pinheiros' } })
  })

  it('adds the selected purpose to the search URL', () => {
    const href = buildSearchHref({
      selectedSearch: { location: '', propertyType: '' },
      searchDraft: { location: '', propertyType: '' },
      priceRange: [null, null],
      purpose: 'buy',
    })

    expect(href).toEqual({ pathname: '/properties', query: { purpose: 'buy' } })
  })

  it('parses open and bounded price ranges without a ten-thousand ceiling', () => {
    expect(parsePriceRange('2000-8000')).toEqual({ min: 2000, max: 8000 })
    expect(parsePriceRange('500000-2000000')).toEqual({ min: 500000, max: 2000000 })
    expect(parsePriceRange('-750000')).toEqual({ min: null, max: 750000 })
    expect(parsePriceRange('25000-')).toEqual({ min: 25000, max: null })
    expect(parsePriceRange('0-10000')).toEqual({ min: 0, max: 10000 })
    expect(parsePriceRange('0-0')).toEqual({ min: 0, max: 0 })
    expect(parsePriceRange('2500.5-8000.75')).toEqual({ min: 2500.5, max: 8000.75 })
    expect(parsePriceRange('8000-2000')).toEqual({ min: null, max: null })
    expect(parsePriceRange('abc')).toEqual({ min: null, max: null })
    expect(parsePriceRange(undefined)).toEqual({ min: null, max: null })
  })
})
