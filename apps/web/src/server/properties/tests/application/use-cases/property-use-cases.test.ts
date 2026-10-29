import { createOwnerDirectory } from '../../fixtures/property-owner-directory'
import { describe, expect, it, vi } from 'vitest'

import {
  ContractPropertyTransitionError,
  PropertyNotFoundError,
  PropertyPublishValidationError,
} from '../../../domain/errors'
import type { Property } from '../../../types/property'
import type { PropertyRepository } from '../../../application/ports/property-repository.port'
import { CreatePropertyUseCase } from '../../../application/use-cases/create-property.use-case'
import { DeletePropertyUseCase } from '../../../application/use-cases/delete-property.use-case'
import { GetPropertyUseCase } from '../../../application/use-cases/get-property.use-case'
import { ListPropertiesUseCase } from '../../../application/use-cases/list-properties.use-case'
import { PublishPropertyUseCase } from '../../../application/use-cases/publish-property.use-case'
import { TransitionPropertyFromActiveContractUseCase } from '../../../application/use-cases/transition-property-from-active-contract.use-case'
import { UnpublishPropertyUseCase } from '../../../application/use-cases/unpublish-property.use-case'
import { UpdatePropertyUseCase } from '../../../application/use-cases/update-property.use-case'

const property: Property = {
  id: 'property-1',
  tenantId: 'tenant-1',
  responsibleId: 'user-1',
  responsibleName: 'Corretor responsável',
  activeContractId: null,
  ownerId: null,
  listing: {
    amenities: [],
    negotiationTerms: null,
    publishAfterReview: false,
    allowWhatsappContact: false,
    featured: false,
  },
  title: 'Apartamento no centro',
  description: 'Imóvel pronto para locação',
  purpose: 'RENT',
  type: 'APARTMENT',
  status: 'DRAFT',
  publishedAt: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  address: {
    street: 'Rua XV de Novembro',
    number: '100',
    complement: null,
    neighborhood: 'Centro',
    city: 'Curitiba',
    state: 'PR',
    zipCode: '80020000',
    latitude: null,
    longitude: null,
  },
  media: [
    {
      id: 'media-1',
      url: 'https://cdn.ketris.dev/property-1/photo.jpg',
      type: 'photo',
      position: 0,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    },
  ],
  values: {
    price: 2500,
    rentalPrice: null,
    condoFee: 400,
    propertyTax: 100,
  },
  characteristics: {
    bedrooms: 2,
    bathrooms: 1,
    parkingSpots: 1,
    areaSqm: 60,
  },
}

function createRepository(overrides?: Partial<PropertyRepository>): PropertyRepository {
  return {
    create: vi.fn().mockResolvedValue(property),
    listPage: vi.fn().mockResolvedValue({
      properties: [property],
      pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      counts: { DRAFT: 1, PUBLISHED: 0, RENTED: 0, SOLD: 0, INACTIVE: 0 },
    }),
    findByTenantAndId: vi.fn().mockResolvedValue(property),
    update: vi.fn().mockResolvedValue(property),
    setStatus: vi.fn().mockResolvedValue(property),
    findRenterContractProperty: vi.fn(),
    findContractProperty: vi.fn().mockResolvedValue({
      contractId: 'contract-1',
      propertyId: property.id,
      contractStatus: 'ACTIVE',
      purpose: 'RENT',
    }),
    ...overrides,
  }
}

describe('properties use cases', () => {
  it('resolves and persists the address coordinates when creating without manual coordinates', async () => {
    const repository = createRepository()
    const geocoder = { locate: vi.fn().mockResolvedValue({ latitude: -25.42, longitude: -49.27 }) }
    await new CreatePropertyUseCase(repository, createOwnerDirectory(), geocoder).execute({
      actorTenantId: 'tenant-1',
      actorUserId: 'user-1',
      actorRole: 'AGENT',
      title: property.title,
      purpose: property.purpose,
      type: property.type,
      price: property.values.price,
      address: property.address!,
    })
    expect(geocoder.locate).toHaveBeenCalledWith(property.address)
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        address: expect.objectContaining({ latitude: -25.42, longitude: -49.27 }),
      }),
      'user-1',
    )
  })

  it('geocodes a changed address instead of retaining its old coordinates', async () => {
    const oldAddress = { ...property.address!, latitude: -23.55, longitude: -46.63 }
    const repository = createRepository({
      findByTenantAndId: vi.fn().mockResolvedValue({ ...property, address: oldAddress }),
    })
    const geocoder = { locate: vi.fn().mockResolvedValue({ latitude: -22.43, longitude: -45.45 }) }
    await new UpdatePropertyUseCase(repository, createOwnerDirectory(), geocoder).execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorRole: 'AGENT',
      id: property.id,
      address: { ...oldAddress, city: 'Itajubá', state: 'MG' },
    })
    expect(geocoder.locate).toHaveBeenCalled()
    expect(repository.update).toHaveBeenCalledWith(
      'tenant-1',
      property.id,
      expect.objectContaining({
        address: expect.objectContaining({ city: 'Itajubá', latitude: -22.43, longitude: -45.45 }),
      }),
      'user-1',
    )
  })

  it('cria imóvel sempre no tenant e responsável do ator autenticado', async () => {
    const repository = createRepository()
    const useCase = new CreatePropertyUseCase(repository, createOwnerDirectory())

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorUserId: 'user-1',
      actorRole: 'OWNER',
      title: property.title,
      purpose: property.purpose,
      type: property.type,
      price: property.values.price,
    })

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        responsibleId: 'user-1',
        title: property.title,
      }),
      'user-1',
    )
  })

  it('bloqueia RENTER ao tentar criar imóvel', async () => {
    const repository = createRepository()
    const useCase = new CreatePropertyUseCase(repository, createOwnerDirectory())

    expect(() =>
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'user-1',
        actorRole: 'RENTER',
        title: property.title,
        purpose: property.purpose,
        type: property.type,
        price: property.values.price,
      }),
    ).toThrow('Só a equipe da imobiliária e o proprietário gerenciam imóveis.')
    expect(repository.create).not.toHaveBeenCalled()
  })

  describe('GetPropertyUseCase', () => {
    it('uses the renter identity when reading a linked property', async () => {
      const repository = createRepository()
      await expect(
        new GetPropertyUseCase(repository).execute({
          actorTenantId: 'tenant-1',
          actorId: 'renter-1',
          actorRole: 'RENTER',
          id: 'property-1',
        }),
      ).resolves.toEqual(property)
      expect(repository.findByTenantAndId).toHaveBeenCalledWith(
        'tenant-1',
        'property-1',
        'renter-1',
        undefined,
      )
    })

    it('returns an opaque error when no renter property link is found', async () => {
      const repository = createRepository({ findByTenantAndId: vi.fn().mockResolvedValue(null) })
      await expect(
        new GetPropertyUseCase(repository).execute({
          actorTenantId: 'tenant-1',
          actorId: 'renter-1',
          actorRole: 'RENTER',
          id: 'foreign',
        }),
      ).rejects.toThrow(PropertyNotFoundError)
    })
    it('retorna o imóvel para o AGENT responsável', async () => {
      const repository = createRepository()
      const useCase = new GetPropertyUseCase(repository)

      await expect(
        useCase.execute({
          actorTenantId: 'tenant-1',
          actorId: 'user-1',
          actorRole: 'AGENT',
          id: 'property-1',
        }),
      ).resolves.toEqual(property)
    })

    it('retorna o imóvel para o OWNER do tenant mesmo sem ser o responsável', async () => {
      const repository = createRepository()
      const useCase = new GetPropertyUseCase(repository)

      await expect(
        useCase.execute({
          actorTenantId: 'tenant-1',
          actorId: 'admin-1',
          actorRole: 'OWNER',
          id: 'property-1',
        }),
      ).resolves.toEqual(property)
    })

    it('bloqueia com erro opaco um AGENT que não é o responsável', async () => {
      const repository = createRepository()
      const useCase = new GetPropertyUseCase(repository)

      await expect(
        useCase.execute({
          actorTenantId: 'tenant-1',
          actorId: 'outro-agente',
          actorRole: 'AGENT',
          id: 'property-1',
        }),
      ).rejects.toThrow(PropertyNotFoundError)
    })
  })

  describe('ListPropertiesUseCase', () => {
    it('lista imóveis do tenant sem filtrar por responsável quando o ator é OWNER', async () => {
      const repository = createRepository()
      const useCase = new ListPropertiesUseCase(repository)

      await useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'admin-1',
        actorRole: 'OWNER',
        status: 'DRAFT',
        purpose: 'RENT',
      })

      expect(repository.listPage).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        page: 1,
        pageSize: 25,
        search: undefined,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        status: 'DRAFT',
        purpose: 'RENT',
        responsibleId: undefined,
      })
    })

    it('filtra por responsável quando o ator é AGENT', async () => {
      const repository = createRepository()
      const useCase = new ListPropertiesUseCase(repository)

      await useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorRole: 'AGENT',
      })

      expect(repository.listPage).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', responsibleId: 'user-1' }),
      )
    })

    it('scopes renter lists to the authenticated user', async () => {
      const repository = createRepository()
      const useCase = new ListPropertiesUseCase(repository)

      await expect(
        useCase.execute({ actorTenantId: 'tenant-1', actorId: 'renter-1', actorRole: 'RENTER' }),
      ).resolves.toMatchObject({ properties: [property] })
      expect(repository.listPage).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', renterId: 'renter-1' }),
      )
    })
  })

  it('atualiza imóvel somente dentro do tenant do ator', async () => {
    const repository = createRepository()
    const useCase = new UpdatePropertyUseCase(repository, createOwnerDirectory())

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      id: 'property-1',
      actorRole: 'OWNER',
      title: 'Novo título',
    })

    expect(repository.update).toHaveBeenCalledWith(
      'tenant-1',
      'property-1',
      expect.objectContaining({ title: 'Novo título' }),
      'user-1',
    )
  })

  it('lança erro opaco quando imóvel de outro tenant não é encontrado', async () => {
    const repository = createRepository({ findByTenantAndId: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdatePropertyUseCase(repository, createOwnerDirectory())

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-2',
        actorId: 'user-1',
        id: 'property-1',
        actorRole: 'OWNER',
        title: 'Novo título',
      }),
    ).rejects.toThrow(PropertyNotFoundError)
  })

  it('bloqueia RENTER ao tentar atualizar imóvel', async () => {
    const repository = createRepository()
    const useCase = new UpdatePropertyUseCase(repository, createOwnerDirectory())

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        id: 'property-1',
        actorRole: 'RENTER',
        title: 'Novo título',
      }),
    ).rejects.toThrow('Só a equipe da imobiliária e o proprietário gerenciam imóveis.')
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('bloqueia com erro opaco um AGENT que tenta atualizar imóvel de outro corretor', async () => {
    const repository = createRepository()
    const useCase = new UpdatePropertyUseCase(repository, createOwnerDirectory())

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'outro-agente',
        id: 'property-1',
        actorRole: 'AGENT',
        title: 'Novo título',
      }),
    ).rejects.toThrow(PropertyNotFoundError)
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('permite que o admin da imobiliária atualize um imóvel de outro corretor do mesmo tenant', async () => {
    const repository = createRepository()
    const useCase = new UpdatePropertyUseCase(repository, createOwnerDirectory())

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'admin-1',
      id: 'property-1',
      actorRole: 'OWNER',
      title: 'Novo título',
    })

    expect(repository.update).toHaveBeenCalled()
  })

  it('publica imóvel completo', async () => {
    const publishedAt = new Date('2026-08-02T00:00:00.000Z')
    const repository = createRepository()
    const useCase = new PublishPropertyUseCase(repository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      id: 'property-1',
      actorRole: 'OWNER',
      publishedAt,
    })

    expect(repository.setStatus).toHaveBeenCalledWith(
      'tenant-1',
      'property-1',
      'PUBLISHED',
      publishedAt,
      'user-1',
    )
  })

  it('bloqueia publicação sem endereço e mídia', async () => {
    const incompleteProperty: Property = { ...property, address: null, media: [] }
    const repository = createRepository({
      findByTenantAndId: vi.fn().mockResolvedValue(incompleteProperty),
    })
    const useCase = new PublishPropertyUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        id: 'property-1',
        actorRole: 'OWNER',
      }),
    ).rejects.toThrow(PropertyPublishValidationError)
    expect(repository.setStatus).not.toHaveBeenCalled()
  })

  it('bloqueia RENTER ao tentar publicar imóvel', async () => {
    const repository = createRepository()
    const useCase = new PublishPropertyUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'renter-1',
        id: 'property-1',
        actorRole: 'RENTER',
      }),
    ).rejects.toThrow('Só a equipe da imobiliária e o proprietário gerenciam imóveis.')
    expect(repository.findByTenantAndId).not.toHaveBeenCalled()
  })

  it('bloqueia com erro opaco um AGENT que tenta publicar imóvel de outro corretor', async () => {
    const repository = createRepository()
    const useCase = new PublishPropertyUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'outro-agente',
        id: 'property-1',
        actorRole: 'AGENT',
      }),
    ).rejects.toThrow(PropertyNotFoundError)
    expect(repository.setStatus).not.toHaveBeenCalled()
  })

  it('despublica imóvel movendo status para inativo', async () => {
    const repository = createRepository()
    const useCase = new UnpublishPropertyUseCase(repository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      id: 'property-1',
      actorRole: 'OWNER',
    })

    expect(repository.setStatus).toHaveBeenCalledWith(
      'tenant-1',
      'property-1',
      'INACTIVE',
      null,
      'user-1',
    )
  })

  it('bloqueia RENTER ao tentar despublicar imóvel', async () => {
    const repository = createRepository()
    const useCase = new UnpublishPropertyUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'renter-1',
        id: 'property-1',
        actorRole: 'RENTER',
      }),
    ).rejects.toThrow('Só a equipe da imobiliária e o proprietário gerenciam imóveis.')
    expect(repository.setStatus).not.toHaveBeenCalled()
  })

  it('bloqueia com erro opaco um AGENT que tenta despublicar imóvel de outro corretor', async () => {
    const repository = createRepository()
    const useCase = new UnpublishPropertyUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'outro-agente',
        id: 'property-1',
        actorRole: 'AGENT',
      }),
    ).rejects.toThrow(PropertyNotFoundError)
    expect(repository.setStatus).not.toHaveBeenCalled()
  })

  describe('DeletePropertyUseCase', () => {
    it('bloqueia RENTER ao tentar excluir imóvel', async () => {
      const repository = createRepository()
      const useCase = new DeletePropertyUseCase(repository)

      await expect(
        useCase.execute({
          actorTenantId: 'tenant-1',
          actorId: 'renter-1',
          id: 'property-1',
          actorRole: 'RENTER',
        }),
      ).rejects.toThrow('Só a equipe da imobiliária e o proprietário gerenciam imóveis.')
      expect(repository.setStatus).not.toHaveBeenCalled()
    })

    it('bloqueia com erro opaco um AGENT que tenta excluir imóvel de outro corretor', async () => {
      const repository = createRepository()
      const useCase = new DeletePropertyUseCase(repository)

      await expect(
        useCase.execute({
          actorTenantId: 'tenant-1',
          actorId: 'outro-agente',
          id: 'property-1',
          actorRole: 'AGENT',
        }),
      ).rejects.toThrow(PropertyNotFoundError)
      expect(repository.setStatus).not.toHaveBeenCalled()
    })

    it('permite que o próprio corretor responsável exclua seu imóvel sem vínculos', async () => {
      const repository = createRepository()
      const useCase = new DeletePropertyUseCase(repository)

      await useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        id: 'property-1',
        actorRole: 'AGENT',
      })

      expect(repository.setStatus).toHaveBeenCalledWith(
        'tenant-1',
        'property-1',
        'INACTIVE',
        null,
        'user-1',
      )
    })

    it('permite que o admin da imobiliária exclua um imóvel de outro corretor', async () => {
      const repository = createRepository()
      const useCase = new DeletePropertyUseCase(repository)

      await useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'admin-1',
        id: 'property-1',
        actorRole: 'OWNER',
      })

      expect(repository.setStatus).toHaveBeenCalledWith(
        'tenant-1',
        'property-1',
        'INACTIVE',
        null,
        'admin-1',
      )
    })

    it('inativa o imóvel mesmo com propostas ou contratos vinculados', async () => {
      const repository = createRepository()
      const useCase = new DeletePropertyUseCase(repository)

      await useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        id: 'property-1',
        actorRole: 'AGENT',
      })
      expect(repository.setStatus).toHaveBeenCalledWith(
        'tenant-1',
        'property-1',
        'INACTIVE',
        null,
        'user-1',
      )
    })

    it('lança erro opaco quando o imóvel não existe no tenant do ator', async () => {
      const repository = createRepository({ findByTenantAndId: vi.fn().mockResolvedValue(null) })
      const useCase = new DeletePropertyUseCase(repository)

      await expect(
        useCase.execute({
          actorTenantId: 'tenant-2',
          actorId: 'user-1',
          id: 'property-1',
          actorRole: 'OWNER',
        }),
      ).rejects.toThrow(PropertyNotFoundError)
    })
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
        contractStatus: 'ACTIVE',
        purpose: 'SALE',
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
        contractStatus: 'AWAITING_SIGNATURE',
        purpose: 'RENT',
      }),
    })
    const useCase = new TransitionPropertyFromActiveContractUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', contractId: 'contract-1' }),
    ).rejects.toThrow(ContractPropertyTransitionError)
    expect(repository.setStatus).not.toHaveBeenCalled()
  })
})
