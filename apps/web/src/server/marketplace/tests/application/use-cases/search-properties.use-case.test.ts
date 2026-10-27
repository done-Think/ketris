import { describe, expect, it, vi } from 'vitest'

import type { PublishedPropertySummary } from '../../../types/property'
import type { PublicPropertyRepository } from '../../../application/ports/public-property-repository.port'
import { SearchPropertiesUseCase } from '../../../application/use-cases/search-properties.use-case'

const summary: PublishedPropertySummary = {
  id: 'imovel-1',
  title: 'Apartamento no centro',
  purpose: 'ALUGUEL',
  propertyType: 'APARTAMENTO',
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
}

function createDeps(search?: PublicPropertyRepository['search']) {
  const propertyRepository: PublicPropertyRepository = {
    search: search ?? vi.fn().mockResolvedValue({ items: [summary], totalCount: 1 }),
    findPublishedById: vi.fn(),
  }

  return { propertyRepository }
}

describe('SearchPropertiesUseCase', () => {
  it('separa filtros e página ao consultar o repositório e devolve a página pedida', async () => {
    const search = vi.fn().mockResolvedValue({ items: [summary], totalCount: 31 })
    const deps = createDeps(search)
    const useCase = new SearchPropertiesUseCase(deps.propertyRepository)

    const result = await useCase.execute({
      purpose: 'ALUGUEL',
      city: 'Curitiba',
      maxPrice: 3000,
      page: 3,
      pageSize: 12,
    })

    expect(search).toHaveBeenCalledWith(
      { purpose: 'ALUGUEL', city: 'Curitiba', maxPrice: 3000 },
      { page: 3, pageSize: 12 },
    )
    expect(result).toEqual({ items: [summary], totalCount: 31, page: 3, pageSize: 12 })
  })

  it('retorna página vazia quando o repositório não encontra imóveis', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue({ items: [], totalCount: 0 }))
    const useCase = new SearchPropertiesUseCase(deps.propertyRepository)

    const result = await useCase.execute({ page: 1, pageSize: 12 })

    expect(result).toEqual({ items: [], totalCount: 0, page: 1, pageSize: 12 })
  })
})
