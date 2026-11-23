import type { AvailableFavoriteEntry } from '../../types/favorite-property'

export function availableFavorite(
  id: string,
  overrides: Partial<AvailableFavoriteEntry['property']> & { savedAt?: string } = {},
): AvailableFavoriteEntry {
  const { savedAt = '2026-11-20T12:00:00.000Z', ...property } = overrides
  return {
    propertyId: id,
    savedAt,
    available: true,
    property: {
      id,
      title: `Imóvel ${id}`,
      purpose: 'RENT',
      propertyType: 'APARTMENT',
      price: 1000,
      rentalPrice: null,
      condoFee: null,
      propertyTax: null,
      bedrooms: 2,
      bathrooms: 1,
      parkingSpots: 1,
      area: 60,
      city: 'Campinas',
      neighborhood: 'Cambuí',
      latitude: null,
      longitude: null,
      brokerName: 'Joao lucas',
      brokerAvatarUrl: null,
      coverUrl: null,
      publishedAt: '2026-11-01T00:00:00.000Z',
      ...property,
    },
  }
}
