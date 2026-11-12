import { describe, expect, it, vi } from 'vitest'
import { ReadPropertyHistoryUseCase } from '../../../application/use-cases/read-property-history.use-case'
import { GetPropertyUseCase } from '../../../application/use-cases/get-property.use-case'
import type { PropertyRepository } from '../../../application/ports/property-repository.port'
import { historyProperty as property } from '../../fixtures/history-property'

function setup() {
  const repository: PropertyRepository = {
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    listPage: vi.fn(),
    findContractProperty: vi.fn(),
    findRenterContractProperty: vi.fn(),
    findByTenantAndId: vi.fn().mockResolvedValue(property),
  }
  const history = {
    list: vi.fn().mockResolvedValue({
      events: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    }),
    find: vi.fn().mockResolvedValue(null),
  }
  return {
    history,
    repository,
    read: new ReadPropertyHistoryUseCase(new GetPropertyUseCase(repository), history),
  }
}
const actor = {
  actorTenantId: 'agency',
  actorId: 'broker',
  actorRole: 'AGENT' as const,
  id: 'property',
}
describe('property history authorization', () => {
  it('uses the same property access authorization and tenant scope for listing and details', async () => {
    const d = setup()
    await d.read.execute(actor)
    expect(d.history.list).toHaveBeenCalledWith('agency', 'property', 1, 20)
    await expect(d.read.execute({ ...actor, actorId: 'outsider' })).rejects.toThrow()
    expect(d.history.list).toHaveBeenCalledTimes(1)
    await expect(d.read.execute({ ...actor, eventId: 'other-event' })).rejects.toThrow()
    expect(d.history.find).toHaveBeenCalledWith('agency', 'property', 'other-event')
  })
  it('does not expose audit history to renters or unavailable properties', async () => {
    const d = setup()
    await expect(d.read.execute({ ...actor, actorRole: 'RENTER' })).rejects.toThrow()
    vi.mocked(d.repository.findByTenantAndId).mockResolvedValue(null)
    await expect(d.read.execute(actor)).rejects.toThrow()
    expect(d.history.list).not.toHaveBeenCalled()
  })
})
