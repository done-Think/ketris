import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@shared/lib/api/http-client'

import { PropertiesService } from '../../services/properties-service'
import type { Property, PropertyFormValues } from '../../types/property'

const apiProperty = {
  id: 'property-1',
  tenantId: 'tenant-1',
  responsavelId: 'user-1',
  proprietarioId: null,
  responsavelNome: 'Corretor responsável',
  activeContractId: null,
  anuncio: {
    comodidades: [],
    condicoesNegociacao: null,
    publicarAposRevisao: false,
    permiteContatoWhatsapp: false,
    destaque: false,
  },
  titulo: 'Apartamento Jardins',
  descricao: 'Pronto para morar',
  finalidade: 'ALUGUEL' as const,
  tipo: 'APARTAMENTO',
  status: 'PUBLISHED' as const,
  publicadoEm: '2026-09-01T10:00:00.000Z',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  endereco: {
    logradouro: 'Alameda Lorena',
    numero: '1420',
    complemento: null,
    bairro: 'Jardins',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01000-000',
    latitude: null,
    longitude: null,
  },
  midias: [
    {
      id: 'media-1',
      url: 'https://cdn.ketris.dev/foto.jpg',
      tipo: 'foto',
      ordem: 0,
      createdAt: '2026-08-01T10:00:00.000Z',
    },
  ],
  valores: { valor: 6500, valorAluguel: null, condominio: 1200, iptu: 380 },
  caracteristicas: { quartos: 3, banheiros: 2, vagas: 2, areaM2: 95 },
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
      type: 'foto',
      order: 0,
      createdAt: '2026-08-01T10:00:00.000Z',
    },
  ],
  values: { price: 6500, rentalPrice: null, condoFee: 1200, propertyTax: 380 },
  characteristics: { bedrooms: 3, bathrooms: 2, parkingSpots: 2, areaM2: 95 },
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
      params: { page: 1, pageSize: 100, status: 'PUBLISHED', finalidade: 'VENDA' },
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
      areaM2: 95,
      price: 6500,
      rentalPrice: null,
      condoFee: 1200,
      propertyTax: 380,
    }

    await expect(service.create(payload)).resolves.toEqual(mappedProperty)
    expect(http.post).toHaveBeenCalledWith('/properties', {
      titulo: 'Apartamento Jardins',
      descricao: 'Pronto para morar',
      finalidade: 'ALUGUEL',
      tipo: 'APARTAMENTO',
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      areaM2: 95,
      valor: 6500,
      valorAluguel: null,
      condominio: 1200,
      iptu: 380,
      endereco: undefined,
      midias: undefined,
    })
  })

  it('updates a property, only translating the fields provided', async () => {
    http.patch.mockResolvedValueOnce({ property: apiProperty })

    await expect(service.update('property-1', { price: 7000 })).resolves.toEqual(mappedProperty)
    expect(http.patch).toHaveBeenCalledWith('/properties/property-1', { valor: 7000 })
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
    const anuncio = {
      comodidades: ['MOBILIADO', 'ACEITA_PETS'],
      condicoesNegociacao: 'Caução',
      publicarAposRevisao: true,
      permiteContatoWhatsapp: false,
      destaque: true,
    }
    const listing: Property['listing'] = {
      amenities: ['furnished', 'petFriendly'],
      negotiationTerms: 'Caução',
      publishAfterReview: true,
      allowWhatsappContact: false,
      featured: true,
    }
    http.post.mockResolvedValueOnce({ property: { ...apiProperty, tipo: 'OUTRO', anuncio } })
    const result = await service.create({
      title: 'Imóvel',
      purpose: 'SALE',
      type: 'other',
      price: 500000,
      listing,
    })
    expect(http.post).toHaveBeenCalledWith(
      '/properties',
      expect.objectContaining({ tipo: 'OUTRO', finalidade: 'VENDA', anuncio }),
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
