import { describe, expect, it, vi } from 'vitest'

import { OpportunityNotFoundError } from '../../../domain/errors'
import type { Opportunity } from '../../../domain/opportunity.entity'
import type { ActivityRepository } from '../../../application/ports/activity-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../../../application/ports/property-lookup.port'
import { AddOpportunityNoteUseCase } from '../../../application/use-cases/add-opportunity-note.use-case'

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

function createPropertyLookup(findResponsavelId?: PropertyLookupPort['findResponsavelId']) {
  return {
    findResponsavelId: findResponsavelId ?? vi.fn().mockResolvedValue('agent-1'),
  } as unknown as PropertyLookupPort
}

describe('AddOpportunityNoteUseCase', () => {
  it('cria uma nota do tipo NOTA por padrão, com o texto sem espaços nas bordas', async () => {
    const findById = vi.fn().mockResolvedValue(opportunity)
    const create = vi.fn().mockResolvedValue({})
    const opportunityRepository = { findById } as unknown as OpportunityRepository
    const activityRepository = { create } as unknown as ActivityRepository
    const useCase = new AddOpportunityNoteUseCase(
      opportunityRepository,
      activityRepository,
      createPropertyLookup(),
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      actorId: 'user-1',
      actorName: 'Ana',
      opportunityId: 'op-1',
      description: '  Ligou para confirmar a visita.  ',
    })

    expect(create).toHaveBeenCalledWith({
      opportunityId: 'op-1',
      type: 'NOTA',
      description: 'Ligou para confirmar a visita.',
      authorId: 'user-1',
      authorName: 'Ana',
      previousStatus: null,
      newStatus: null,
    })
  })

  it('aceita o tipo CONTATO_REALIZADO explicitamente', async () => {
    const findById = vi.fn().mockResolvedValue(opportunity)
    const create = vi.fn().mockResolvedValue({})
    const opportunityRepository = { findById } as unknown as OpportunityRepository
    const activityRepository = { create } as unknown as ActivityRepository
    const useCase = new AddOpportunityNoteUseCase(
      opportunityRepository,
      activityRepository,
      createPropertyLookup(),
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      opportunityId: 'op-1',
      description: 'Falou com o interessado por telefone.',
      type: 'CONTATO_REALIZADO',
    })

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ type: 'CONTATO_REALIZADO' }))
  })

  it('lança OpportunityNotFoundError e não cria nota quando é de outro tenant', async () => {
    const findById = vi.fn().mockResolvedValue({ ...opportunity, tenantId: 'tenant-2' })
    const create = vi.fn()
    const opportunityRepository = { findById } as unknown as OpportunityRepository
    const activityRepository = { create } as unknown as ActivityRepository
    const useCase = new AddOpportunityNoteUseCase(
      opportunityRepository,
      activityRepository,
      createPropertyLookup(),
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'ADMIN',
        opportunityId: 'op-1',
        description: 'x',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(create).not.toHaveBeenCalled()
  })

  it('AGENT que não é responsável pelo imóvel recebe 404 opaco e não cria nota', async () => {
    const findById = vi.fn().mockResolvedValue(opportunity)
    const create = vi.fn()
    const opportunityRepository = { findById } as unknown as OpportunityRepository
    const activityRepository = { create } as unknown as ActivityRepository
    const useCase = new AddOpportunityNoteUseCase(
      opportunityRepository,
      activityRepository,
      createPropertyLookup(vi.fn().mockResolvedValue('outro-agente')),
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorPapel: 'AGENT',
        opportunityId: 'op-1',
        description: 'x',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(create).not.toHaveBeenCalled()
  })
})
