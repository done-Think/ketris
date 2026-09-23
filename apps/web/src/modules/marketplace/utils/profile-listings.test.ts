import { describe, expect, it } from 'vitest'

import { buildProfileListings } from './profile-listings'

const camilaListing = {
  title: 'Sala comercial na Paulista',
  location: 'Bela Vista',
  price: 'R$ 8.500 / mês',
  href: '/properties/sala-comercial-paulista',
  image: 'https://cdn.ketris.com.br/sala-comercial-paulista.jpg',
}

describe('profile listings utils', () => {
  it('only returns the listings actually provided, never padding with unrelated data', () => {
    const listings = buildProfileListings([camilaListing])

    expect(listings).toHaveLength(1)
    expect(listings[0]).toMatchObject({
      href: camilaListing.href,
      title: camilaListing.title,
      image: camilaListing.image,
      details: [],
    })
  })

  it('returns an empty list when there are no real listings', () => {
    expect(buildProfileListings([])).toEqual([])
  })

  it('respects the configured limit', () => {
    const listings = buildProfileListings(
      [camilaListing, { ...camilaListing, href: '/properties/outra' }],
      { limit: 1 },
    )

    expect(listings).toHaveLength(1)
    expect(listings[0].href).toBe(camilaListing.href)
  })
})
