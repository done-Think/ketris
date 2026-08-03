import { describe, expect, it } from 'vitest'

import { buildSearchHref, formatSearchCurrency, normalizeSearchText } from './search'

describe('marketplace search utils', () => {
  it('normalizes accents and casing for search filtering', () => {
    expect(normalizeSearchText('Jardins, São Paulo')).toBe('jardins, sao paulo')
  })

  it('formats price values as BRL without cents', () => {
    expect(formatSearchCurrency(10000).replace(/\s/, ' ')).toBe('R$ 10.000')
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

    expect(href).toBe('/imoveis?localizacao=Jardins%2C+S%C3%A3o+Paulo&tipo=Studio&preco=0-10000')
  })
})
