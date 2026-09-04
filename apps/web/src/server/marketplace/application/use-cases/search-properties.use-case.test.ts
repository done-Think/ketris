import { describe, expect, it, vi } from 'vitest'

import type { PublishedPropertySummary } from '../../domain/property.entity'
import type { PublicPropertyRepository } from '../ports/public-property-repository.port'
import { SearchPropertiesUseCase } from './search-properties.use-case'

const summary: PublishedPropertySummary = {
  id: 'imovel-1',
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
  coverUrl: 'https://cdn.ketris.dev/imovel-1/capa.jpg',
  publishedAt: new Date('2026-08-01T00:00:00.000Z'),
}

function createDeps(search?: PublicPropertyRepository['search']) {
  const propertyRepository: PublicPropertyRepository = {
    search: search ?? vi.fn().mockResolvedValue([summary]),
    findPublishedById: vi.fn(),
  }

  return { propertyRepository }
}

describe('SearchPropertiesUseCase', () => {
  it('encaminha os filtros ao repositório e retorna a lista de resumos', async () => {
    const search = vi.fn().mockResolvedValue([summary])
    const deps = createDeps(search)
    const useCase = new SearchPropertiesUseCase(deps.propertyRepository)

    const result = await useCase.execute({
      purpose: 'ALUGUEL',
      city: 'Curitiba',
      maxPrice: 3000,
    })

    expect(search).toHaveBeenCalledWith({
      purpose: 'ALUGUEL',
      city: 'Curitiba',
      maxPrice: 3000,
    })
    expect(result).toEqual([summary])
  })

  it('retorna lista vazia quando o repositório não encontra imóveis', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue([]))
    const useCase = new SearchPropertiesUseCase(deps.propertyRepository)

    const result = await useCase.execute({})

    expect(result).toEqual([])
  })
})
