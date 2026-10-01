import { describe, expect, it } from 'vitest'

import {
  createPublicPropertySearchFiltersSchema,
  publicPropertyDetailSchema,
  publicPropertySummarySchema,
} from '../../schemas/property-schema'

const publicPropertySearchFiltersSchema = createPublicPropertySearchFiltersSchema((key) => key)

const summary = {
  id: 'property-1',
  title: 'Apartamento Jardins',
  purpose: 'ALUGUEL',
  propertyType: 'apartamento',
  price: 4800,
  condoFee: 900,
  propertyTax: null,
  bedrooms: 2,
  bathrooms: 2,
  parkingSpots: 1,
  area: 84,
  city: 'Sao Paulo',
  neighborhood: 'Jardins',
  latitude: -23.56,
  longitude: -46.65,
  brokerName: 'Marina Costa',
  brokerAvatarUrl: 'https://cdn.example.com/marina.jpg',
  coverUrl: 'https://cdn.example.com/property.jpg',
  publishedAt: '2026-08-12T10:00:00.000Z',
}

describe('public property schemas', () => {
  it('accepts the existing public property summary contract', () => {
    expect(publicPropertySummarySchema.safeParse(summary).success).toBe(true)
  })

  it('accepts the existing public property detail contract', () => {
    const result = publicPropertyDetailSchema.safeParse({
      ...summary,
      description: 'Apartamento reformado.',
      address: {
        street: 'Alameda Santos',
        number: '1000',
        complement: null,
        neighborhood: 'Jardins',
        city: 'Sao Paulo',
        state: 'SP',
        zipCode: '01418-100',
        latitude: -23.56,
        longitude: -46.65,
      },
      media: [{ id: 'media-1', url: summary.coverUrl, type: 'foto', order: 0 }],
    })

    expect(result.success).toBe(true)
  })

  it('validates only search filters accepted by the endpoint', () => {
    expect(
      publicPropertySearchFiltersSchema.safeParse({
        purpose: 'ALUGUEL',
        maxPrice: 5000,
        minBedrooms: 2,
        q: 'Jardins',
      }).success,
    ).toBe(true)
    expect(publicPropertySearchFiltersSchema.safeParse({ purpose: 'TEMPORADA' }).success).toBe(
      false,
    )
  })

  it('routes each validation message through the translator with the right key', () => {
    const translated = createPublicPropertySearchFiltersSchema((key) => `translated:${key}`)
    const result = translated.safeParse({ city: '' })

    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0]?.message).toBe(
      'translated:cityInvalid',
    )
  })
})
