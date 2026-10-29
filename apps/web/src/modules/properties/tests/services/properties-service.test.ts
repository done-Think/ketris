import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@shared/lib/api/http-client'

import { PropertiesService } from '../../services/properties-service'
import type { Property, PropertyFormValues } from '../../types/property'

const apiProperty = {
  id: 'property-1',
  tenantId: 'tenant-1',
  responsibleId: 'user-1',
  ownerId: null,
  responsibleName: 'Corretor responsável',
  activeContractId: null,
  listing: {
    amenities: [],
    negotiationTerms: null,
    publishAfterReview: false,
    allowWhatsappContact: false,
    featured: false,
  },
  title: 'Apartamento Jardins',
  description: 'Pronto para morar',
  purpose: 'RENT' as const,
  type: 'APARTMENT',
  status: 'PUBLISHED' as const,
  publishedAt: '2026-09-01T10:00:00.000Z',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  address: {
    street: 'Alameda Lorena',
    number: '1420',
    complement: null,
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    latitude: null,
    longitude: null,
  },
  media: [
    {
      id: 'media-1',
      url: 'https://cdn.ketris.dev/foto.jpg',
      type: 'photo',
      position: 0,
      createdAt: '2026-08-01T10:00:00.000Z',
    },
  ],
  values: { price: 6500, rentalPrice: null, condoFee: 1200, propertyTax: 380 },
  characteristics: { bedrooms: 3, bathrooms: 2, parkingSpots: 2, areaSqm: 95 },
}

const mappedProperty: Property = {
  id: 'property-1',
  tenantId: 'tenant-1',
  responsibleUserId: 'user-1',
  ownerUserId: null,
  responsibleName: 'Corretor responsável',
  activeContractId: null,
  listing: {
    amenities: [],
    negotiationTerms: null,
    publishAfterReview: false,
    allowWhatsappContact: false,
    featured: false,
  },
  title: 'Apartamento Jardins',
  description: 'Pronto para morar',
  purpose: 'RENT',
  type: 'apartment',
  status: 'PUBLISHED',
  publishedAt: '2026-09-01T10:00:00.000Z',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  address: {
    street: 'Alameda Lorena',
    number: '1420',
    complement: null,
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01000-000',
    latitude: null,
    longitude: null,
  },
  media: [
    {
      id: 'media-1',
      url: 'https://cdn.ketris.dev/foto.jpg',
      type: 'photo',
      order: 0,
      createdAt: '2026-08-01T10:00:00.000Z',
    },
  ],
  values: { price: 6500, rentalPrice: null, condoFee: 1200, propertyTax: 380 },
  characteristics: { bedrooms: 3, bathrooms: 2, parkingSpots: 2, areaSqm: 95 },
}

describe('PropertiesService', () => {
  const http = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
  let service: PropertiesService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new PropertiesService(http as unknown as HttpClient)
  })

  it('lists properties, unwraps the response and translates fields to English', async () => {
    http.get.mockResolvedValueOnce({
      properties: [apiProperty],
      pagination: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
      counts: {},
    })

    await expect(service.list()).resolves.toEqual([mappedProperty])
    expect(http.get).toHaveBeenCalledWith('/properties', { params: { page: 1, pageSize: 100 } })
  })

  it('lists properties with status/purpose filters translated to the API shape', async () => {
    http.get.mockResolvedValueOnce({
      properties: [],
      pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
      counts: {},
    })

    await service.list({ status: 'PUBLISHED', purpose: 'SALE' })

    expect(http.get).toHaveBeenCalledWith('/properties', {
      params: { page: 1, pageSize: 100, status: 'PUBLISHED', purpose: 'SALE' },
    })
  })

  it('gets one property by id and unwraps the response', async () => {
    http.get.mockResolvedValueOnce({ property: apiProperty })

    await expect(service.getById('property-1')).resolves.toEqual(mappedProperty)
    expect(http.get).toHaveBeenCalledWith('/properties/property-1')
  })

  it('creates a property, translating the request to the API shape', async () => {
    http.post.mockResolvedValueOnce({ property: apiProperty })

    const payload: PropertyFormValues = {
      title: 'Apartamento Jardins',
      description: 'Pronto para morar',
      purpose: 'RENT',
      type: 'apartment',
      bedrooms: 3,
      bathrooms: 2,
      parkingSpots: 2,
      areaSqm: 95,
      price: 6500,
      rentalPrice: null,
      condoFee: 1200,
      propertyTax: 380,
    }

    await expect(service.create(payload)).resolves.toEqual(mappedProperty)
    expect(http.post).toHaveBeenCalledWith('/properties', {
      title: 'Apartamento Jardins',
      description: 'Pronto para morar',
      purpose: 'RENT',
      type: 'APARTMENT',
      bedrooms: 3,
      bathrooms: 2,
      parkingSpots: 2,
      areaSqm: 95,
      price: 6500,
      rentalPrice: null,
      condoFee: 1200,
      propertyTax: 380,
      address: undefined,
      media: undefined,
    })
  })

  it('updates a property, only translating the fields provided', async () => {
    http.patch.mockResolvedValueOnce({ property: apiProperty })

    await expect(service.update('property-1', { price: 7000 })).resolves.toEqual(mappedProperty)
    expect(http.patch).toHaveBeenCalledWith('/properties/property-1', { price: 7000 })
  })

  it('publishes a property and unwraps the response', async () => {
    http.post.mockResolvedValueOnce({ property: apiProperty })

    await expect(service.publish('property-1')).resolves.toEqual(mappedProperty)
    expect(http.post).toHaveBeenCalledWith('/properties/property-1/publish')
  })

  it('unpublishes a property and unwraps the response', async () => {
    http.post.mockResolvedValueOnce({ property: apiProperty })

    await expect(service.unpublish('property-1')).resolves.toEqual(mappedProperty)
    expect(http.post).toHaveBeenCalledWith('/properties/property-1/unpublish')
  })

  it('removes a property with no response body', async () => {
    http.delete.mockResolvedValueOnce(undefined)

    await expect(service.remove('property-1')).resolves.toBeUndefined()
    expect(http.delete).toHaveBeenCalledWith('/properties/property-1')
  })
  it('maps stable English identifiers to API enums and restores them on the response', async () => {
    const apiListing = {
      amenities: ['FURNISHED', 'PET_FRIENDLY'],
      negotiationTerms: 'Caução',
      publishAfterReview: true,
      allowWhatsappContact: false,
      featured: true,
    }
    const listing: Property['listing'] = {
      amenities: ['furnished', 'petFriendly'],
      negotiationTerms: 'Caução',
      publishAfterReview: true,
      allowWhatsappContact: false,
      featured: true,
    }
    http.post.mockResolvedValueOnce({
      property: { ...apiProperty, type: 'OTHER', listing: apiListing },
    })
    const result = await service.create({
      title: 'Imóvel',
      purpose: 'SALE',
      type: 'other',
      price: 500000,
      listing,
    })
    expect(http.post).toHaveBeenCalledWith(
      '/properties',
      expect.objectContaining({ type: 'OTHER', purpose: 'SALE', listing: apiListing }),
    )
    expect(result.type).toBe('other')
    expect(result.listing).toEqual(listing)
  })
  it('retrieves all pages for consumers that still need the full authorized collection', async () => {
    const properties = Array.from({ length: 101 }, (_, index) => ({
      ...apiProperty,
      id: `property-${index}`,
    }))
    http.get
      .mockResolvedValueOnce({
        properties: properties.slice(0, 100),
        pagination: { page: 1, pageSize: 100, total: 101, totalPages: 2 },
        counts: {},
      })
      .mockResolvedValueOnce({
        properties: properties.slice(100),
        pagination: { page: 2, pageSize: 100, total: 101, totalPages: 2 },
        counts: {},
      })
    const result = await service.list()
    expect(result).toHaveLength(101)
    expect(new Set(result.map((property) => property.id)).size).toBe(101)
    expect(http.get).toHaveBeenLastCalledWith('/properties', { params: { page: 2, pageSize: 100 } })
  })
})
