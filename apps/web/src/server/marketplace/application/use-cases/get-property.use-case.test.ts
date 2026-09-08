import { describe, expect, it, vi } from 'vitest'

import { PropertyNotFoundError } from '../../domain/errors'
import type { PublishedPropertyDetail } from '../../domain/property.entity'
import type { PublicPropertyRepository } from '../ports/public-property-repository.port'
import { GetPropertyUseCase } from './get-property.use-case'

const detail: PublishedPropertyDetail = {
  id: 'imovel-1',
  tenantId: 'tenant-1',
  title: 'Apartamento no centro',
  purpose: 'ALUGUEL',
  propertyType: 'apartamento',
  price: 2500,
  condoFee: 400,
  propertyTax: 100,
  bedrooms: 2,
  bathrooms: 1,
  parkingSpots: 1,
  area: 60,
  city: 'Curitiba',
  neighborhood: 'Centro',
  latitude: -25.4284,
  longitude: -49.2733,
  brokerName: 'Marina Costa',
  brokerAvatarUrl: null,
  coverUrl: 'https://cdn.ketris.dev/imovel-1/capa.jpg',
  publishedAt: new Date('2026-08-01T00:00:00.000Z'),
  description: 'Ótima localização',
  address: {
    street: 'Rua XV',
    number: '100',
    complement: null,
    neighborhood: 'Centro',
    city: 'Curitiba',
    state: 'PR',
    zipCode: '80000-000',
    latitude: null,
    longitude: null,
  },
  media: [
    { id: 'midia-1', url: 'https://cdn.ketris.dev/imovel-1/capa.jpg', type: 'foto', order: 0 },
  ],
}

function createDeps(findPublishedById?: PublicPropertyRepository['findPublishedById']) {
  const propertyRepository: PublicPropertyRepository = {
    search: vi.fn(),
    findPublishedById: findPublishedById ?? vi.fn().mockResolvedValue(detail),
  }

  return { propertyRepository }
}

describe('GetPropertyUseCase', () => {
  it('retorna o detalhe público do imóvel sem expor o tenantId', async () => {
    const deps = createDeps()
    const useCase = new GetPropertyUseCase(deps.propertyRepository)

    const result = await useCase.execute({ propertyId: 'imovel-1' })

    expect(result.id).toBe('imovel-1')
    expect(result).not.toHaveProperty('tenantId')
    expect(result.media).toHaveLength(1)
  })

  it('lança PropertyNotFoundError quando o imóvel não existe ou não está publicado', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue(null))
    const useCase = new GetPropertyUseCase(deps.propertyRepository)

    await expect(useCase.execute({ propertyId: 'inexistente' })).rejects.toThrow(
      PropertyNotFoundError,
    )
  })
})
