import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@shared/lib/api/http-client'

import { PropertiesService } from '../../services/properties-service'
import type { Property, PropertyFormValues } from '../../types/property'

const apiProperty = {
  id: 'property-1',
  tenantId: 'tenant-1',
  responsavelId: 'user-1',
  titulo: 'Apartamento Jardins',
  descricao: 'Pronto para morar',
  finalidade: 'ALUGUEL' as const,
  tipo: 'apartamento',
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
  valores: { valor: 6500, condominio: 1200, iptu: 380 },
  caracteristicas: { quartos: 3, banheiros: 2, vagas: 2, areaM2: 95 },
}

const mappedProperty: Property = {
  id: 'property-1',
  tenantId: 'tenant-1',
  responsibleUserId: 'user-1',
  title: 'Apartamento Jardins',
  description: 'Pronto para morar',
  purpose: 'RENT',
  type: 'apartamento',
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
  values: { price: 6500, condoFee: 1200, propertyTax: 380 },
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
    http.get.mockResolvedValueOnce({ properties: [apiProperty] })

    await expect(service.list()).resolves.toEqual([mappedProperty])
    expect(http.get).toHaveBeenCalledWith('/properties', { params: {} })
  })

  it('lists properties with status/purpose filters translated to the API shape', async () => {
    http.get.mockResolvedValueOnce({ properties: [] })

    await service.list({ status: 'PUBLISHED', purpose: 'SALE' })

    expect(http.get).toHaveBeenCalledWith('/properties', {
      params: { status: 'PUBLISHED', finalidade: 'VENDA' },
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
      type: 'apartamento',
      bedrooms: 3,
      bathrooms: 2,
      parkingSpots: 2,
      areaM2: 95,
      price: 6500,
      condoFee: 1200,
      propertyTax: 380,
    }

    await expect(service.create(payload)).resolves.toEqual(mappedProperty)
    expect(http.post).toHaveBeenCalledWith('/properties', {
      titulo: 'Apartamento Jardins',
      descricao: 'Pronto para morar',
      finalidade: 'ALUGUEL',
      tipo: 'apartamento',
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      areaM2: 95,
      valor: 6500,
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

  it('deactivates a property and unwraps the response', async () => {
    http.delete.mockResolvedValueOnce({ property: apiProperty })

    await expect(service.deactivate('property-1')).resolves.toEqual(mappedProperty)
    expect(http.delete).toHaveBeenCalledWith('/properties/property-1')
  })
})
