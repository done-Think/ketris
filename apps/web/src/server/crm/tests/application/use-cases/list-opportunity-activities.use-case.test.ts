import { describe, expect, it, vi } from 'vitest'

import { OpportunityNotFoundError } from '../../../domain/errors'
import type { Opportunity } from '../../../domain/opportunity.entity'
import type { ActivityRepository } from '../../../application/ports/activity-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { ListOpportunityActivitiesUseCase } from '../../../application/use-cases/list-opportunity-activities.use-case'

const opportunity: Opportunity = {
  id: 'op-1',
  tenantId: 'tenant-1',
  propertyId: 'imovel-1',
  contactId: null,
  leadName: 'Maria',
  leadEmail: 'maria@exemplo.com',
  leadPhone: null,
  proposedValue: 2500,
  contractTermMonths: null,
  desiredStartDate: null,
  guaranteeType: 'NENHUMA',
  specialConditions: [],
  notes: null,
  status: 'ENVIADA',
  archivedAt: null,
  createdAt: new Date('2026-08-10T00:00:00.000Z'),
  updatedAt: new Date('2026-08-10T00:00:00.000Z'),
}

describe('ListOpportunityActivitiesUseCase', () => {
  it('retorna a timeline da oportunidade do tenant do ator', async () => {
    const findById = vi.fn().mockResolvedValue(opportunity)
    const findManyByOpportunity = vi.fn().mockResolvedValue([])
    const opportunityRepository = { findById } as unknown as OpportunityRepository
    const activityRepository = { findManyByOpportunity } as unknown as ActivityRepository
    const useCase = new ListOpportunityActivitiesUseCase(opportunityRepository, activityRepository)

    await useCase.execute({ actorTenantId: 'tenant-1', opportunityId: 'op-1' })

    expect(findManyByOpportunity).toHaveBeenCalledWith('op-1')
  })

  it('lança OpportunityNotFoundError sem consultar a timeline quando é de outro tenant', async () => {
    const findById = vi.fn().mockResolvedValue({ ...opportunity, tenantId: 'tenant-2' })
    const findManyByOpportunity = vi.fn()
    const opportunityRepository = { findById } as unknown as OpportunityRepository
    const activityRepository = { findManyByOpportunity } as unknown as ActivityRepository
    const useCase = new ListOpportunityActivitiesUseCase(opportunityRepository, activityRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', opportunityId: 'op-1' }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(findManyByOpportunity).not.toHaveBeenCalled()
  })
})
