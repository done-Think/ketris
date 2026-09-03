import { describe, expect, it, vi } from 'vitest'

import { OpportunityNotFoundError } from '../../../domain/errors'
import type { Opportunity } from '../../../domain/opportunity.entity'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { DeleteOpportunityUseCase } from '../../../application/use-cases/delete-opportunity.use-case'

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

describe('DeleteOpportunityUseCase', () => {
  it('exclui permanentemente a oportunidade do tenant do ator', async () => {
    const findById = vi.fn().mockResolvedValue(opportunity)
    const del = vi.fn().mockResolvedValue(undefined)
    const repository = { findById, delete: del } as unknown as OpportunityRepository
    const useCase = new DeleteOpportunityUseCase(repository)

    await useCase.execute({ actorTenantId: 'tenant-1', opportunityId: 'op-1' })

    expect(del).toHaveBeenCalledWith('op-1')
  })

  it('lança OpportunityNotFoundError e não exclui quando é de outro tenant', async () => {
    const findById = vi.fn().mockResolvedValue({ ...opportunity, tenantId: 'tenant-2' })
    const del = vi.fn()
    const repository = { findById, delete: del } as unknown as OpportunityRepository
    const useCase = new DeleteOpportunityUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', opportunityId: 'op-1' }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(del).not.toHaveBeenCalled()
  })
})
