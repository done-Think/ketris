import { describe, expect, it, vi } from 'vitest'

import { PropertyNotFoundError } from '../../domain/errors'
import type { PublishedPropertyDetail } from '../../domain/property.entity'
import type { PublicPropertyRepository } from '../ports/public-property-repository.port'
import { GetPropertyUseCase } from './get-property.use-case'

const detail: PublishedPropertyDetail = {
  id: 'imovel-1',
  tenantId: 'tenant-1',
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
  descricao: 'Ótima localização',
  endereco: {
    logradouro: 'Rua XV',
    numero: '100',
    complemento: null,
    bairro: 'Centro',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80000-000',
    latitude: null,
    longitude: null,
  },
  midias: [
    { id: 'midia-1', url: 'https://cdn.ketris.dev/imovel-1/capa.jpg', tipo: 'foto', ordem: 0 },
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
    expect(result.midias).toHaveLength(1)
  })

  it('lança PropertyNotFoundError quando o imóvel não existe ou não está publicado', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue(null))
    const useCase = new GetPropertyUseCase(deps.propertyRepository)

    await expect(useCase.execute({ propertyId: 'inexistente' })).rejects.toThrow(
      PropertyNotFoundError,
    )
  })
})
