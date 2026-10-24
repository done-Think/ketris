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
  responsavelId: 'agent-1',
  proprietarioId: 'owner-1',
} as Property

function createRepository(): PropertyRepository {
  return {
    create: vi.fn(),
    list: vi.fn().mockResolvedValue([property]),
    findByTenantAndId: vi.fn().mockResolvedValue(property),
    update: vi.fn(),
    setStatus: vi.fn(),
    findContractProperty: vi.fn(),
    findRenterContractProperty: vi.fn(),
    hasLinkedRecords: vi.fn(),
    delete: vi.fn(),
  }
}

const propertyOwner = {
  actorTenantId: 'tenant-1',
  actorId: 'owner-1',
  actorPapel: 'PROPERTY_OWNER' as const,
}

describe('proprietário do imóvel (PROPERTY_OWNER)', () => {
  it('lista só os imóveis em que é o proprietário', async () => {
    const repository = createRepository()

    await new ListPropertiesUseCase(repository).execute(propertyOwner)

    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', proprietarioId: 'owner-1' }),
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

  it('cria o imóvel já como proprietário dele', () => {
    const repository = createRepository()

    new CreatePropertyUseCase(repository).execute({
      actorTenantId: 'tenant-1',
      actorUserId: 'owner-1',
      actorPapel: 'PROPERTY_OWNER',
      titulo: 'Casa',
      finalidade: 'ALUGUEL',
      tipo: 'casa',
      valor: 1000,
    })

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ responsavelId: 'owner-1', proprietarioId: 'owner-1' }),
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
      proprietarioId: 'outro-dono',
    })

    await expect(
      new PublishPropertyUseCase(repository).execute({ ...propertyOwner, id: 'property-1' }),
    ).rejects.toThrow(PropertyNotFoundError)
    expect(repository.setStatus).not.toHaveBeenCalled()
  })

  it('o locatário não cria imóveis', () => {
    expect(() =>
      new CreatePropertyUseCase(createRepository()).execute({
        actorTenantId: 'tenant-1',
        actorUserId: 'renter-1',
        actorPapel: 'RENTER',
        titulo: 'Casa',
        finalidade: 'ALUGUEL',
        tipo: 'casa',
        valor: 1000,
      }),
    ).toThrow(ForbiddenError)
  })
})
