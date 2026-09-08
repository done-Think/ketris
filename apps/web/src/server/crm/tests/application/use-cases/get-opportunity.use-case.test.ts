import { describe, expect, it, vi } from 'vitest'

import { OpportunityNotFoundError } from '../../../domain/errors'
import type { Opportunity } from '../../../domain/opportunity.entity'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { GetOpportunityUseCase } from '../../../application/use-cases/get-opportunity.use-case'

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

describe('GetOpportunityUseCase', () => {
  it('retorna a oportunidade quando pertence ao tenant do ator', async () => {
    const findById = vi.fn().mockResolvedValue(opportunity)
    const repository = { findById } as unknown as OpportunityRepository
    const useCase = new GetOpportunityUseCase(repository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', opportunityId: 'op-1' })

    expect(result).toEqual(opportunity)
  })

  it('lança OpportunityNotFoundError quando a oportunidade não existe', async () => {
    const findById = vi.fn().mockResolvedValue(null)
    const repository = { findById } as unknown as OpportunityRepository
    const useCase = new GetOpportunityUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', opportunityId: 'inexistente' }),
    ).rejects.toThrow(OpportunityNotFoundError)
  })

  it('lança OpportunityNotFoundError (opaco) quando a oportunidade é de outro tenant', async () => {
    const findById = vi.fn().mockResolvedValue({ ...opportunity, tenantId: 'tenant-2' })
    const repository = { findById } as unknown as OpportunityRepository
    const useCase = new GetOpportunityUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', opportunityId: 'op-1' }),
    ).rejects.toThrow(OpportunityNotFoundError)
  })
})
