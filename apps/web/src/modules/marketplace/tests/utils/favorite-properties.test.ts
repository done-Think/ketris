import { describe, expect, it } from 'vitest'

import {
  countFavorites,
  getFavoriteCardPurpose,
  selectFavorites,
  toFavoriteCard,
} from '../../utils/favorite-properties'
import { availableFavorite, unavailableFavorite } from '../fixtures/favorite-properties'

const rent = availableFavorite('rent', { price: 2300, savedAt: '2026-11-21T00:00:00.000Z' })
const sale = availableFavorite('sale', {
  purpose: 'SALE',
  price: 890000,
  savedAt: '2026-11-22T00:00:00.000Z',
})
const both = availableFavorite('both', {
  purpose: 'BOTH',
  price: 500000,
  rentalPrice: 1800,
  savedAt: '2026-11-19T00:00:00.000Z',
})
const gone = unavailableFavorite('gone', '2026-11-30T00:00:00.000Z')
const entries = [rent, sale, both, gone]
const ids = (list: { propertyId: string }[]) => list.map((entry) => entry.propertyId)
const t = (key: string) => key

describe('favorite properties', () => {
  it('counts each property in every purpose it can be negotiated', () => {
    expect(countFavorites(entries)).toEqual({ all: 4, rent: 2, buy: 2 })
  })

  it('lists the most recently saved first', () => {
    expect(ids(selectFavorites(entries, { purpose: 'all', sort: 'relevancia' }))).toEqual([
      'gone',
      'sale',
      'rent',
      'both',
    ])
  })

  it('uses the rental price of a rent-or-sale property when filtering by rent', () => {
    expect(ids(selectFavorites(entries, { purpose: 'rent', sort: 'menor-preco' }))).toEqual([
      'both',
      'rent',
    ])
    expect(ids(selectFavorites(entries, { purpose: 'buy', sort: 'maior-preco' }))).toEqual([
      'sale',
      'both',
    ])
  })

  it('shows a rent-or-sale property as a sale only inside the buy filter', () => {
    expect(getFavoriteCardPurpose(both, 'all')).toBe('alugar')
    expect(getFavoriteCardPurpose(both, 'buy')).toBe('comprar')
    expect(getFavoriteCardPurpose(sale, 'all')).toBe('comprar')
  })

  it('builds the same card the search uses, linking to the right purpose', () => {
    const card = toFavoriteCard(sale, 'all', 'pt-BR', t as never)

    expect(card).toMatchObject({
      id: 'sale',
      title: 'Imóvel sale',
      href: '/properties/sale?purpose=buy',
      purpose: 'comprar',
    })
  })
})
