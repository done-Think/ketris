import { describe, expect, it, vi } from 'vitest'

import type { PublishedPropertySummary } from '../../domain/property.entity'
import type { PublicPropertyRepository } from '../ports/public-property-repository.port'
import { SearchPropertiesUseCase } from './search-properties.use-case'

const summary: PublishedPropertySummary = {
  id: 'imovel-1',
  titulo: 'Apartamento no centro',
  finalidade: 'ALUGUEL',
  tipo: 'apartamento',
  valor: 2500,
  condominio: 400,
  iptu: 100,
  quartos: 2,
  banheiros: 1,
  vagas: 1,
  areaM2: 60,
  cidade: 'Curitiba',
  bairro: 'Centro',
  capaUrl: 'https://cdn.ketris.dev/imovel-1/capa.jpg',
  publicadoEm: new Date('2026-08-01T00:00:00.000Z'),
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
      finalidade: 'ALUGUEL',
      cidade: 'Curitiba',
      precoMax: 3000,
    })

    expect(search).toHaveBeenCalledWith({
      finalidade: 'ALUGUEL',
      cidade: 'Curitiba',
      precoMax: 3000,
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
