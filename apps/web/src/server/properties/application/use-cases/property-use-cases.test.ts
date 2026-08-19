import { describe, expect, it, vi } from 'vitest'

import {
  ContractPropertyTransitionError,
  PropertyNotFoundError,
  PropertyPublishValidationError,
} from '../../domain/errors'
import type { Property } from '../../domain/property.entity'
import type { PropertyRepository } from '../ports/property-repository.port'
import { CreatePropertyUseCase } from './create-property.use-case'
import { ListPropertiesUseCase } from './list-properties.use-case'
import { PublishPropertyUseCase } from './publish-property.use-case'
import { TransitionPropertyFromActiveContractUseCase } from './transition-property-from-active-contract.use-case'
import { UnpublishPropertyUseCase } from './unpublish-property.use-case'
import { UpdatePropertyUseCase } from './update-property.use-case'

const property: Property = {
  id: 'property-1',
  tenantId: 'tenant-1',
  responsavelId: 'user-1',
  titulo: 'Apartamento no centro',
  descricao: 'Imóvel pronto para locação',
  finalidade: 'ALUGUEL',
  tipo: 'apartamento',
  status: 'DRAFT',
  publicadoEm: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  endereco: {
    logradouro: 'Rua XV de Novembro',
    numero: '100',
    complemento: null,
    bairro: 'Centro',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80020000',
    latitude: null,
    longitude: null,
  },
  midias: [
    {
      id: 'media-1',
      url: 'https://cdn.ketris.dev/property-1/photo.jpg',
      tipo: 'foto',
      ordem: 0,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    },
  ],
  valores: {
    valor: 2500,
    condominio: 400,
    iptu: 100,
  },
  caracteristicas: {
    quartos: 2,
    banheiros: 1,
    vagas: 1,
    areaM2: 60,
  },
}

function createRepository(overrides?: Partial<PropertyRepository>): PropertyRepository {
  return {
    create: vi.fn().mockResolvedValue(property),
    list: vi.fn().mockResolvedValue([property]),
    findByTenantAndId: vi.fn().mockResolvedValue(property),
    update: vi.fn().mockResolvedValue(property),
    setStatus: vi.fn().mockResolvedValue(property),
    findContractProperty: vi.fn().mockResolvedValue({
      contractId: 'contract-1',
      propertyId: property.id,
      contractStatus: 'ATIVO',
      finalidade: 'ALUGUEL',
    }),
    ...overrides,
  }
}

describe('properties use cases', () => {
  it('cria imóvel sempre no tenant e responsável do ator autenticado', async () => {
    const repository = createRepository()
    const useCase = new CreatePropertyUseCase(repository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorUserId: 'user-1',
      titulo: property.titulo,
      finalidade: property.finalidade,
      tipo: property.tipo,
      valor: property.valores.valor,
    })

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        responsavelId: 'user-1',
        titulo: property.titulo,
      }),
    )
  })

  it('lista imóveis filtrando pelo tenant do ator', async () => {
    const repository = createRepository()
    const useCase = new ListPropertiesUseCase(repository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      status: 'DRAFT',
      finalidade: 'ALUGUEL',
    })

    expect(repository.list).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      status: 'DRAFT',
      finalidade: 'ALUGUEL',
    })
  })

  it('atualiza imóvel somente dentro do tenant do ator', async () => {
    const repository = createRepository()
    const useCase = new UpdatePropertyUseCase(repository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      id: 'property-1',
      titulo: 'Novo título',
    })

    expect(repository.update).toHaveBeenCalledWith(
      'tenant-1',
      'property-1',
      expect.objectContaining({ titulo: 'Novo título' }),
    )
  })

  it('lança erro opaco quando imóvel de outro tenant não é encontrado', async () => {
    const repository = createRepository({ update: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdatePropertyUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-2',
        id: 'property-1',
        titulo: 'Novo título',
      }),
    ).rejects.toThrow(PropertyNotFoundError)
  })

  it('publica imóvel completo', async () => {
    const publishedAt = new Date('2026-08-02T00:00:00.000Z')
    const repository = createRepository()
    const useCase = new PublishPropertyUseCase(repository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      id: 'property-1',
      publishedAt,
    })

    expect(repository.setStatus).toHaveBeenCalledWith(
      'tenant-1',
      'property-1',
      'PUBLISHED',
      publishedAt,
    )
  })

  it('bloqueia publicação sem endereço e mídia', async () => {
    const incompleteProperty: Property = { ...property, endereco: null, midias: [] }
    const repository = createRepository({
      findByTenantAndId: vi.fn().mockResolvedValue(incompleteProperty),
    })
    const useCase = new PublishPropertyUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        id: 'property-1',
      }),
    ).rejects.toThrow(PropertyPublishValidationError)
    expect(repository.setStatus).not.toHaveBeenCalled()
  })

  it('despublica imóvel movendo status para inativo', async () => {
    const repository = createRepository()
    const useCase = new UnpublishPropertyUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1', id: 'property-1' })

    expect(repository.setStatus).toHaveBeenCalledWith('tenant-1', 'property-1', 'INACTIVE', null)
  })

  it('marca imóvel como alugado quando contrato ativo de aluguel é processado', async () => {
    const repository = createRepository()
    const useCase = new TransitionPropertyFromActiveContractUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1', contractId: 'contract-1' })

    expect(repository.findContractProperty).toHaveBeenCalledWith('tenant-1', 'contract-1')
    expect(repository.setStatus).toHaveBeenCalledWith('tenant-1', 'property-1', 'RENTED', null)
  })

  it('marca imóvel como vendido quando contrato ativo de venda é processado', async () => {
    const repository = createRepository({
      findContractProperty: vi.fn().mockResolvedValue({
        contractId: 'contract-2',
        propertyId: 'property-2',
        contractStatus: 'ATIVO',
        finalidade: 'VENDA',
      }),
    })
    const useCase = new TransitionPropertyFromActiveContractUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1', contractId: 'contract-2' })

    expect(repository.setStatus).toHaveBeenCalledWith('tenant-1', 'property-2', 'SOLD', null)
  })

  it('não altera imóvel quando contrato associado ainda não está ativo', async () => {
    const repository = createRepository({
      findContractProperty: vi.fn().mockResolvedValue({
        contractId: 'contract-1',
        propertyId: 'property-1',
        contractStatus: 'AGUARDANDO_ASSINATURA',
        finalidade: 'ALUGUEL',
      }),
    })
    const useCase = new TransitionPropertyFromActiveContractUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', contractId: 'contract-1' }),
    ).rejects.toThrow(ContractPropertyTransitionError)
    expect(repository.setStatus).not.toHaveBeenCalled()
  })
})
