import { describe, expect, it } from 'vitest'

import {
  ownerProperties,
  ownerPropertiesDefaultFilters,
  ownerPropertiesSummary,
} from '../../fixtures/owner-properties'
import { filterOwnerProperties } from '../../utils/owner-properties'

describe('owner properties fixtures', () => {
  it('preserves the four reference cards and their existing detail route ids', () => {
    expect(ownerProperties).toHaveLength(4)
    expect(ownerProperties.map(({ id }) => id)).toEqual([
      'apt-jardins-3q',
      'studio-pinheiros',
      'casa-alto-pinheiros',
      'apt-moema-2q',
    ])
    expect(
      ownerProperties.map(({ title, price, views, favorites, proposals }) => ({
        title,
        price,
        views,
        favorites,
        proposals,
      })),
    ).toEqual([
      {
        title: 'Apartamento 3q - Jardins',
        price: 'R$ 4.800/mês',
        views: 342,
        favorites: 28,
        proposals: 5,
      },
      {
        title: 'Studio Loft Pinheiros',
        price: 'R$ 3.200/mês',
        views: 124,
        favorites: 12,
        proposals: 2,
      },
      {
        title: 'Casa Duplex Alto da Lapa',
        price: 'R$ 8.900/mês',
        views: 204,
        favorites: 18,
        proposals: 1,
      },
      {
        title: 'Apartamento Moderno Moema',
        price: 'R$ 5.500/mês',
        views: 410,
        favorites: 35,
        proposals: 0,
      },
    ])
  })

  it('keeps the visual badge and literal summary independent from card totals', () => {
    expect(ownerProperties.map(({ status }) => status)).toEqual([
      'active',
      'active',
      'active',
      'paused',
    ])
    expect(ownerProperties.every(({ badgeStatus }) => badgeStatus === 'active')).toBe(true)
    expect(ownerPropertiesSummary).toEqual({
      totalProperties: 4,
      activeProperties: 3,
      pausedProperties: 1,
      totalViews: 342,
      openProposals: 7,
    })
  })
})

describe('filterOwnerProperties', () => {
  it('returns all rental properties with the default filters', () => {
    expect(filterOwnerProperties(ownerProperties, ownerPropertiesDefaultFilters)).toEqual(
      ownerProperties,
    )
  })

  it('searches title, address, and code without case or accent sensitivity', () => {
    expect(
      filterOwnerProperties(ownerProperties, {
        ...ownerPropertiesDefaultFilters,
        searchQuery: 'JARDÍNS',
      }).map(({ id }) => id),
    ).toEqual(['apt-jardins-3q'])

    expect(
      filterOwnerProperties(ownerProperties, {
        ...ownerPropertiesDefaultFilters,
        searchQuery: 'sao paulo',
      }),
    ).toHaveLength(4)

    expect(
      filterOwnerProperties(ownerProperties, {
        ...ownerPropertiesDefaultFilters,
        searchQuery: 'imv-004',
      }).map(({ id }) => id),
    ).toEqual(['apt-moema-2q'])
  })

  it('filters by status and purpose', () => {
    expect(
      filterOwnerProperties(ownerProperties, {
        searchQuery: '',
        status: 'active',
        purpose: 'rent',
      }),
    ).toHaveLength(3)
    expect(
      filterOwnerProperties(ownerProperties, {
        searchQuery: '',
        status: 'paused',
        purpose: 'rent',
      }).map(({ id }) => id),
    ).toEqual(['apt-moema-2q'])
    expect(
      filterOwnerProperties(ownerProperties, {
        searchQuery: '',
        status: 'all',
        purpose: 'sale',
      }),
    ).toEqual([])
  })

  it('combines all filters without mutating the source collection', () => {
    const sourceSnapshot = structuredClone(ownerProperties)

    expect(
      filterOwnerProperties(ownerProperties, {
        searchQuery: 'MOEMA',
        status: 'paused',
        purpose: 'rent',
      }).map(({ id }) => id),
    ).toEqual(['apt-moema-2q'])
    expect(ownerProperties).toEqual(sourceSnapshot)
  })
})
