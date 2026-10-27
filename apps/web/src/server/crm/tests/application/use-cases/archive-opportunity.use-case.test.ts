import { describe, expect, it, vi } from 'vitest'

import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { ArchiveOpportunityUseCase } from '../../../application/use-cases/archive-opportunity.use-case'
import { OpportunityNotFoundError } from '../../../domain/errors'
import type { Opportunity } from '../../../domain/opportunity.entity'

const opportunity: Opportunity = {
  id: 'op-1',
  tenantId: 'tenant-1',
  propertyId: 'imovel-1',
  responsibleId: 'agent-1',
  responsibleName: 'Agente Um',
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

describe('ArchiveOpportunityUseCase', () => {
  it('arquiva a oportunidade do tenant do ator', async () => {
    const findById = vi.fn().mockResolvedValue(opportunity)
    const archive = vi.fn().mockResolvedValue({ ...opportunity, archivedAt: new Date() })
    const repository = { findById, archive } as unknown as OpportunityRepository
    const useCase = new ArchiveOpportunityUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'OWNER',
      opportunityId: 'op-1',
    })

    expect(archive).toHaveBeenCalledWith('op-1')
    expect(result.archivedAt).not.toBeNull()
  })

  it('lança OpportunityNotFoundError e não arquiva quando é de outro tenant', async () => {
    const findById = vi.fn().mockResolvedValue({ ...opportunity, tenantId: 'tenant-2' })
    const archive = vi.fn()
    const repository = { findById, archive } as unknown as OpportunityRepository
    const useCase = new ArchiveOpportunityUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorPapel: 'OWNER',
        opportunityId: 'op-1',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(archive).not.toHaveBeenCalled()
  })

  it('AGENT que não é responsável pela oportunidade recebe 404 opaco e não arquiva', async () => {
    const findById = vi.fn().mockResolvedValue(opportunity)
    const archive = vi.fn()
    const repository = { findById, archive } as unknown as OpportunityRepository
    const useCase = new ArchiveOpportunityUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-2',
        actorPapel: 'AGENT',
        opportunityId: 'op-1',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(archive).not.toHaveBeenCalled()
  })
})
