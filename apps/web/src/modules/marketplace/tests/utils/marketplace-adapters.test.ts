import { describe, expect, it, vi } from 'vitest'

import * as agencyEditor from '../../utils/agency-public-profile-editor-adapter'
import * as brokerEditor from '../../utils/public-profile-editor-adapter'
import { getPropertyFeatureLabel } from '../../utils/property-feature-label'
import {
  buildProfileListingHref,
  buildPropertyDetailHref,
  buildPublicProfileHref,
  getInternalMarketplaceHref,
  isSafeMarketplaceOriginHref,
} from '../../utils/property-links'
import { mapSummaryToSearchResult } from '../../utils/property-summary-adapter'
import type { PublicPropertySummary } from '../../types/public-property'

describe('property links', () => {
  it('maps localized marketplace paths to their internal routes', () => {
    expect(getInternalMarketplaceHref('/imoveis/p1?x=1')).toBe('/properties/p1?x=1')
    expect(getInternalMarketplaceHref('/corretores/b1')).toBe('/brokers/b1')
    expect(getInternalMarketplaceHref('/imobiliarias/a1')).toBe('/agencies/a1')
    expect(getInternalMarketplaceHref('/imoveisx')).toBe('/imoveisx')
  })

  it('builds detail and listing links that keep where the visitor came from', () => {
    expect(buildPropertyDetailHref('/properties/p1', 'comprar')).toEqual({
      pathname: '/properties/[id]',
      params: { id: 'p1' },
      query: { purpose: 'buy' },
    })
    expect(buildPropertyDetailHref('/elsewhere', 'alugar')).toEqual({
      pathname: '/properties',
      query: { purpose: 'rent' },
    })
    expect(
      buildProfileListingHref('/properties/p1', {
        href: '/corretores/b1',
        name: 'Ana',
        type: 'broker',
      }),
    ).toEqual({
      pathname: '/properties/[id]',
      params: { id: 'p1' },
      query: { source: 'broker', sourceHref: '/brokers/b1', sourceName: 'Ana' },
    })
    expect(buildProfileListingHref('/elsewhere')).toBe('/properties')
  })

  it('builds broker and agency profile links, with the CRECI when present', () => {
    expect(buildPublicProfileHref('/brokers/b1', 'broker')).toEqual({
      pathname: '/brokers/[id]',
      params: { id: 'b1' },
    })
    expect(buildPublicProfileHref('/agencies/horizonte/12345', 'agency')).toEqual({
      pathname: '/agencies/[id]/[creci]',
      params: { id: 'horizonte', creci: '12345' },
    })
    expect(buildPublicProfileHref('/agencies/a1', 'agency')).toEqual({
      pathname: '/agencies/[id]',
      params: { id: 'a1' },
    })
  })

  it('only accepts same-site profile origins of the right kind', () => {
    expect(isSafeMarketplaceOriginHref('/corretores/b1', 'broker')).toBe(true)
    expect(isSafeMarketplaceOriginHref('/agencies/a1', 'agency')).toBe(true)
    expect(isSafeMarketplaceOriginHref('/agencies/a1', 'broker')).toBe(false)
    expect(isSafeMarketplaceOriginHref('//evil.com/brokers/b1', 'broker')).toBe(false)
    expect(isSafeMarketplaceOriginHref('https://evil.com', 'agency')).toBe(false)
    expect(isSafeMarketplaceOriginHref(undefined, 'agency')).toBe(false)
  })
})

describe('property presentation', () => {
  it('translates counted features and keeps free-text ones', () => {
    const t = vi.fn((key: string, values: { count: number }) => `${key}:${values.count}`)
    expect(getPropertyFeatureLabel({ key: 'bedrooms', value: 2, label: '2' }, t as never)).toBe(
      'features.bedrooms:2',
    )
    expect(getPropertyFeatureLabel({ key: 'area', label: '80 m²' }, t as never)).toBe('80 m²')
  })

  it('maps a public summary into a search card with price, location and map position', () => {
    const summary: PublicPropertySummary = {
      id: 'p1',
      title: 'Casa',
      purpose: 'RENT',
      propertyType: 'HOUSE',
      price: 3200,
      condoFee: null,
      propertyTax: null,
      bedrooms: 2,
      bathrooms: 1,
      parkingSpots: 0,
      area: 70,
      city: 'Curitiba',
      neighborhood: null,
      latitude: -25.4,
      longitude: -49.2,
      brokerName: null,
      brokerAvatarUrl: null,
      coverUrl: null,
      publishedAt: null,
    }
    const t = (key: string, values: { count: number } | { price: string }) =>
      `${key}:${'price' in values ? values.price : values.count}`

    const card = mapSummaryToSearchResult(summary, 'alugar', 'pt-BR', t)

    expect(card).toMatchObject({
      id: 'p1',
      href: '/properties/p1',
      location: 'Curitiba',
      broker: '',
      image: '',
      mapCenter: { latitude: -25.4, longitude: -49.2 },
    })
    expect(card.price).toMatch(/^monthly:R\$\s?3\.200$/)
  })
})

describe('public profile editor adapters', () => {
  it('turns broker form text into lists and empty fields into null, and back', () => {
    const draft = brokerEditor.toDraft({
      ...brokerEditor.emptyValues,
      displayName: 'Ana',
      neighborhoods: ' Jardins,  Moema ,, ',
      specialties: '',
    })

    expect(draft).toMatchObject({
      displayName: 'Ana',
      headline: null,
      neighborhoods: ['Jardins', 'Moema'],
      specialties: [],
    })
    expect(brokerEditor.toFormValues(null)).toBe(brokerEditor.emptyValues)
  })

  it('keeps the agency team order and converts the years in market', () => {
    const draft = agencyEditor.toDraft({
      ...agencyEditor.emptyValues,
      displayName: 'Horizonte',
      yearsInMarket: '12',
      coverage: 'Centro, Batel',
      team: [
        { userId: 'u2', name: 'Bia' },
        { userId: 'u1', name: 'Caio' },
      ],
    })

    expect(draft).toMatchObject({
      yearsInMarket: 12,
      coverage: ['Centro', 'Batel'],
      team: [
        { userId: 'u2', order: 0 },
        { userId: 'u1', order: 1 },
      ],
    })
    expect(agencyEditor.toDraft(agencyEditor.emptyValues).yearsInMarket).toBeNull()
  })
})
