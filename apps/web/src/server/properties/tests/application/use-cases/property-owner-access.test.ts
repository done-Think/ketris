import { createOwnerDirectory } from '../../fixtures/property-owner-directory'
import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import type { PropertyRepository } from '../../../application/ports/property-repository.port'
import { CreatePropertyUseCase } from '../../../application/use-cases/create-property.use-case'
import { GetPropertyUseCase } from '../../../application/use-cases/get-property.use-case'
import { ListPropertiesUseCase } from '../../../application/use-cases/list-properties.use-case'
import { PublishPropertyUseCase } from '../../../application/use-cases/publish-property.use-case'
import { UnpublishPropertyUseCase } from '../../../application/use-cases/unpublish-property.use-case'
import { PropertyNotFoundError } from '../../../domain/errors'
import type { Property } from '../../../types/property'

const property = {
  id: 'property-1',
  tenantId: 'tenant-1',
  responsibleId: 'agent-1',
  ownerId: 'owner-1',
} as Property

function createRepository(): PropertyRepository {
  return {
    create: vi.fn(),
    listPage: vi.fn().mockResolvedValue({
      properties: [property],
      pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
      counts: { DRAFT: 1, PUBLISHED: 0, RENTED: 0, SOLD: 0, INACTIVE: 0 },
    }),
    findByTenantAndId: vi.fn().mockResolvedValue(property),
    update: vi.fn(),
    setStatus: vi.fn(),
    findContractProperty: vi.fn(),
    findRenterContractProperty: vi.fn(),
  }
}

const propertyOwner = {
  actorTenantId: 'tenant-1',
  actorId: 'owner-1',
  actorRole: 'PROPERTY_OWNER' as const,
}

describe('proprietário do imóvel (PROPERTY_OWNER)', () => {
  it('lista só os imóveis em que é o proprietário', async () => {
    const repository = createRepository()

    await new ListPropertiesUseCase(repository).execute(propertyOwner)

    expect(repository.listPage).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', ownerId: 'owner-1' }),
    )
  })

  it('lê o imóvel pelo vínculo de proprietário, sem a regra de responsável da equipe', async () => {
    const repository = createRepository()

    await expect(
      new GetPropertyUseCase(repository).execute({ ...propertyOwner, id: 'property-1' }),
    ).resolves.toBe(property)
    expect(repository.findByTenantAndId).toHaveBeenCalledWith(
      'tenant-1',
      'property-1',
      undefined,
      'owner-1',
    )
  })

  it('cria o imóvel já como proprietário dele', async () => {
    const repository = createRepository()

    await new CreatePropertyUseCase(repository, createOwnerDirectory()).execute({
      actorTenantId: 'tenant-1',
      actorUserId: 'owner-1',
      actorRole: 'PROPERTY_OWNER',
      title: 'Casa',
      purpose: 'RENT',
      type: 'HOUSE',
      price: 1000,
    })

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ responsibleId: 'owner-1', ownerId: 'owner-1' }),
      'owner-1',
    )
  })

  it('despublica o imóvel do qual é proprietário', async () => {
    const repository = createRepository()
    vi.mocked(repository.setStatus).mockResolvedValue(property)

    await new UnpublishPropertyUseCase(repository).execute({ ...propertyOwner, id: 'property-1' })

    expect(repository.setStatus).toHaveBeenCalled()
  })

  it('não publica imóvel de outro proprietário', async () => {
    const repository = createRepository()
    vi.mocked(repository.findByTenantAndId).mockResolvedValue({
      ...property,
      ownerId: 'outro-dono',
    })

    await expect(
      new PublishPropertyUseCase(repository).execute({ ...propertyOwner, id: 'property-1' }),
    ).rejects.toThrow(PropertyNotFoundError)
    expect(repository.setStatus).not.toHaveBeenCalled()
  })

  it('o locatário não cria imóveis', () => {
    expect(() =>
      new CreatePropertyUseCase(createRepository(), createOwnerDirectory()).execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'renter-1',
        actorRole: 'RENTER',
        title: 'Casa',
        purpose: 'RENT',
        type: 'HOUSE',
        price: 1000,
      }),
    ).toThrow(ForbiddenError)
  })
})
