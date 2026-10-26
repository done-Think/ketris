import { ForbiddenError } from '@server/shared/errors'
import { describe, expect, it, vi } from 'vitest'
import type { CrmPropertyCatalog } from '../../../application/ports/crm-property-catalog.port'
import { GetCrmPropertyUseCase } from '../../../application/use-cases/get-crm-property.use-case'
import { ListCrmPropertiesUseCase } from '../../../application/use-cases/list-crm-properties.use-case'
import { OpportunityPropertyNotFoundError } from '../../../domain/errors'

const actor = { actorId: 'agent-1', actorTenantId: 'tenant-1', actorPapel: 'AGENT' as const }
describe('CRM property catalog use cases', () => {
  it('delegates paged property selection after authorizing staff', async () => {
    const page = {
      properties: [],
      pagination: { page: 1, pageSize: 10, pageCount: 1, totalCount: 0 },
    }
    const list = vi.fn().mockResolvedValue(page)
    const useCase = new ListCrmPropertiesUseCase({ list } as unknown as CrmPropertyCatalog)
    expect(
      await useCase.execute({ ...actor, filters: { page: 1, pageSize: 10, q: 'Jardins' } }),
    ).toBe(page)
    expect(list).toHaveBeenCalledWith({ page: 1, pageSize: 10, q: 'Jardins' })
  })
  it.each(['RENTER', 'PROPERTY_OWNER'] as const)(
    'refuses property selection by %s',
    async (actorPapel) => {
      const list = vi.fn()
      const useCase = new ListCrmPropertiesUseCase({ list } as unknown as CrmPropertyCatalog)
      await expect(
        useCase.execute({ ...actor, actorPapel, filters: { page: 1, pageSize: 10 } }),
      ).rejects.toThrow(ForbiddenError)
      expect(list).not.toHaveBeenCalled()
    },
  )
  it('returns an opaque 404 for a property outside the authorized catalog', async () => {
    const get = vi.fn().mockResolvedValue(null)
    await expect(
      new GetCrmPropertyUseCase({ get } as unknown as CrmPropertyCatalog).execute({
        ...actor,
        propertyId: 'foreign-property',
      }),
    ).rejects.toThrow(OpportunityPropertyNotFoundError)
  })
})
