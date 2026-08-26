import { describe, expect, it } from 'vitest'

import { buildProfileListings } from './profile-listings'

const marinaListing = {
  title: 'Apartamento espaçoso com vista para o parque',
  location: 'Jardins',
  price: 'R$ 4.800 / mês',
  href: '/imoveis/apartamento-jardins',
}

describe('profile listings utils', () => {
  it('keeps the provided listings first and fills the configured limit without duplicates', () => {
    const listings = buildProfileListings([marinaListing], {
      brokerName: 'Marina Costa',
      coverage: ['Jardins'],
      limit: 6,
    })

    expect(listings).toHaveLength(6)
    expect(listings[0]).toMatchObject({
      href: marinaListing.href,
      title: marinaListing.title,
      category: 'Apartamento',
    })
    expect(new Set(listings.map((listing) => listing.href)).size).toBe(listings.length)
  })

  it('matches additional listings by broker name and coverage before fallback entries', () => {
    const listings = buildProfileListings([], {
      brokerName: 'Marina Costa',
      coverage: ['Jardins'],
      limit: 3,
    })

    expect(listings.map((listing) => listing.href)).toEqual([
      '/imoveis/apartamento-jardins',
      '/imoveis/apartamento-garden-remodelado',
      '/imoveis/loft-industrial-mobiliado',
    ])
  })
})
