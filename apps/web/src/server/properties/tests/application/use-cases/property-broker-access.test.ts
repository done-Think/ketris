import { describe, expect, it, vi } from 'vitest'
import { ForbiddenError } from '@server/shared/errors'
import { PropertyBrokerValidationError, PropertyNotFoundError } from '../../../domain/errors'
import type { Property } from '../../../types/property'
import type { PropertyRepository } from '../../../application/ports/property-repository.port'
import { CreatePropertyUseCase } from '../../../application/use-cases/create-property.use-case'
import { UpdatePropertyUseCase } from '../../../application/use-cases/update-property.use-case'
import { GetPropertyUseCase } from '../../../application/use-cases/get-property.use-case'
import { ListPropertyBrokersUseCase } from '../../../application/use-cases/list-property-brokers.use-case'
import { createOwnerDirectory } from '../../fixtures/property-owner-directory'

const property: Property = {
  id: 'property',
  tenantId: 'agency',
  responsibleId: 'manager',
  responsibleName: 'Manager',
  brokerIds: ['broker-a', 'broker-b'],
  ownerId: null,
  activeContractId: null,
  title: 'House',
  description: null,
  purpose: 'SALE',
  type: 'HOUSE',
  status: 'DRAFT',
  publishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  address: null,
  media: [],
  listing: {
    amenities: [],
    negotiationTerms: null,
    publishAfterReview: false,
    allowWhatsappContact: false,
    featured: false,
  },
  values: { price: 1000, rentalPrice: null, condoFee: null, propertyTax: null },
  characteristics: { bedrooms: null, bathrooms: null, parkingSpots: null, areaSqm: null },
}

function setup() {
  const repository: PropertyRepository = {
    create: vi.fn().mockResolvedValue(property),
    findByTenantAndId: vi.fn().mockResolvedValue(property),
    update: vi.fn().mockResolvedValue(property),
    listPage: vi.fn(),
    setStatus: vi.fn(),
    findContractProperty: vi.fn(),
    findRenterContractProperty: vi.fn(),
  }
  const directory = {
    countActiveBrokers: vi.fn().mockResolvedValue(2),
    listActiveBrokers: vi.fn().mockResolvedValue({
      brokers: [],
      pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
    }),
  }
  return {
    repository,
    directory,
    create: new CreatePropertyUseCase(
      repository,
      createOwnerDirectory(),
      undefined,
      undefined,
      directory,
    ),
    update: new UpdatePropertyUseCase(
      repository,
      createOwnerDirectory(),
      undefined,
      undefined,
      directory,
    ),
  }
}

const manager = {
  actorTenantId: 'agency',
  actorId: 'manager',
  actorRole: 'OWNER' as const,
  id: 'property',
}

describe('property broker access', () => {
  it('grants access to multiple eligible brokers without changing the primary responsible user', async () => {
    const d = setup()
    await d.create.execute({
      actorTenantId: 'agency',
      actorUserId: 'manager',
      actorRole: 'OWNER',
      title: 'House',
      purpose: 'SALE',
      type: 'HOUSE',
      price: 1000,
      brokerIds: ['broker-a', 'broker-b'],
    })
    expect(d.directory.countActiveBrokers).toHaveBeenCalledWith('agency', ['broker-a', 'broker-b'])
    expect(d.repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        responsibleId: 'manager',
        brokerIds: ['broker-a', 'broker-b'],
      }),
      'manager',
    )
  })

  it('supports removing every additional grant explicitly', async () => {
    const d = setup()
    await d.update.execute({ ...manager, brokerIds: [] })
    expect(d.repository.update).toHaveBeenCalledWith(
      'agency',
      'property',
      expect.objectContaining({ brokerIds: [] }),
      'manager',
    )
  })

  it('does not remove grants when an older client omits the field', async () => {
    const d = setup()
    await d.update.execute({ ...manager, title: 'Updated house' })
    expect(d.repository.update).toHaveBeenCalledWith(
      'agency',
      'property',
      expect.objectContaining({ brokerIds: undefined }),
      'manager',
    )
  })

  it.each(['AGENT', 'PROPERTY_OWNER'] as const)(
    'rejects access management by %s, even an empty array',
    async (role) => {
      const d = setup()
      if (role === 'PROPERTY_OWNER') {
        vi.mocked(d.repository.findByTenantAndId).mockResolvedValue({
          ...property,
          ownerId: 'manager',
        })
      }
      await expect(
        d.create.execute({
          actorTenantId: 'agency',
          actorUserId: 'broker-a',
          actorRole: role,
          title: 'House',
          purpose: 'SALE',
          type: 'HOUSE',
          price: 1000,
          brokerIds: [],
        }),
      ).rejects.toThrow(ForbiddenError)
      await expect(
        d.update.execute({
          ...manager,
          actorId: role === 'AGENT' ? 'broker-a' : 'manager',
          actorRole: role,
          brokerIds: [],
        }),
      ).rejects.toThrow(ForbiddenError)
      expect(d.repository.create).not.toHaveBeenCalled()
      expect(d.repository.update).not.toHaveBeenCalled()
    },
  )

  it('rejects the entire change if the directory cannot validate every selected broker', async () => {
    const d = setup()
    d.directory.countActiveBrokers.mockResolvedValue(1)
    await expect(
      d.update.execute({ ...manager, brokerIds: ['broker-a', 'ineligible'] }),
    ).rejects.toThrow(PropertyBrokerValidationError)
    expect(d.repository.update).not.toHaveBeenCalled()
  })

  it('rejects duplicate grants', async () => {
    const d = setup()
    await expect(
      d.update.execute({ ...manager, brokerIds: ['broker-a', 'broker-a'] }),
    ).rejects.toThrow(PropertyBrokerValidationError)
  })

  it('allows both grantees to access the property and denies the removed broker on the next request', async () => {
    const d = setup()
    const get = new GetPropertyUseCase(d.repository)
    for (const actorId of ['broker-a', 'broker-b']) {
      await expect(get.execute({ ...manager, actorId, actorRole: 'AGENT' })).resolves.toEqual(
        property,
      )
    }
    vi.mocked(d.repository.findByTenantAndId).mockResolvedValue({
      ...property,
      brokerIds: ['broker-b'],
    })
    await expect(
      get.execute({ ...manager, actorId: 'broker-a', actorRole: 'AGENT' }),
    ).rejects.toThrow(PropertyNotFoundError)
    await expect(
      get.execute({ ...manager, actorId: 'broker-b', actorRole: 'AGENT' }),
    ).resolves.toBeDefined()
  })

  it('allows an assigned broker to edit the property without changing grants', async () => {
    const d = setup()
    await d.update.execute({
      ...manager,
      actorId: 'broker-a',
      actorRole: 'AGENT',
      title: 'Updated house',
    })
    expect(d.repository.update).toHaveBeenCalled()
  })

  it('scopes the selectable directory to the manager agency', async () => {
    const d = setup()
    const list = new ListPropertyBrokersUseCase(d.directory)
    await list.execute({ actorTenantId: 'agency', actorRole: 'OWNER', page: 2, pageSize: 20 })
    expect(d.directory.listActiveBrokers).toHaveBeenCalledWith('agency', 2, 20)
    expect(() => list.execute({ actorTenantId: 'agency', actorRole: 'AGENT' })).toThrow(
      ForbiddenError,
    )
  })
})
