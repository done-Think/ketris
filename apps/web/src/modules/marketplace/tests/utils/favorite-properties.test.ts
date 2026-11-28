import { describe, expect, it } from 'vitest'

import { getFavoriteCardPurpose, toFavoriteCard } from '../../utils/favorite-properties'
import { availableFavorite } from '../fixtures/favorite-properties'

const sale = availableFavorite('sale', { purpose: 'SALE', price: 890000 })
const both = availableFavorite('both', { purpose: 'BOTH', price: 500000, rentalPrice: 1800 })
const t = (key: string) => key

describe('favorite properties', () => {
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
