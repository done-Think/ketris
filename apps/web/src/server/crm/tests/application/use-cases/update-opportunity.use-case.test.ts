import { describe, expect, it, vi } from 'vitest'

import { InvalidStatusTransitionError, OpportunityNotFoundError } from '../../../domain/errors'
import type { Opportunity } from '../../../domain/opportunity.entity'
import type { ActivityRepository } from '../../../application/ports/activity-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../../../application/ports/property-lookup.port'
import { UpdateOpportunityUseCase } from '../../../application/use-cases/update-opportunity.use-case'

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

function createDeps(overrides?: {
  findById?: OpportunityRepository['findById']
  update?: OpportunityRepository['update']
  findResponsavelId?: PropertyLookupPort['findResponsavelId']
}) {
  const opportunityRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(opportunity),
    update:
      overrides?.update ?? vi.fn().mockResolvedValue({ ...opportunity, status: 'EM_NEGOCIACAO' }),
  } as unknown as OpportunityRepository

  const activityRepository = {
    create: vi.fn().mockResolvedValue({}),
  } as unknown as ActivityRepository

  const propertyLookup = {
    findResponsavelId: overrides?.findResponsavelId ?? vi.fn().mockResolvedValue('agent-1'),
  } as unknown as PropertyLookupPort

  return { opportunityRepository, activityRepository, propertyLookup }
}

describe('UpdateOpportunityUseCase', () => {
  it('atualiza a oportunidade do tenant do ator repassando as mudanças', async () => {
    const update = vi.fn().mockResolvedValue({ ...opportunity, leadName: 'Maria Silva' })
    const deps = createDeps({ update })
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      deps.propertyLookup,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      opportunityId: 'op-1',
      changes: { leadName: 'Maria Silva' },
    })

    expect(update).toHaveBeenCalledWith('op-1', { leadName: 'Maria Silva' })
    expect(result.leadName).toBe('Maria Silva')
  })

  it('lança OpportunityNotFoundError e não atualiza quando é de outro tenant', async () => {
    const update = vi.fn()
    const deps = createDeps({
      findById: vi.fn().mockResolvedValue({ ...opportunity, tenantId: 'tenant-2' }),
      update,
    })
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      deps.propertyLookup,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'ADMIN',
        opportunityId: 'op-1',
        changes: { status: 'ACEITA' },
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(update).not.toHaveBeenCalled()
  })

  it('permite uma transição de status válida e registra a mudança na timeline', async () => {
    const update = vi.fn().mockResolvedValue({ ...opportunity, status: 'EM_NEGOCIACAO' })
    const deps = createDeps({ update })
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      deps.propertyLookup,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      actorId: 'user-1',
      actorName: 'Ana',
      opportunityId: 'op-1',
      changes: { status: 'EM_NEGOCIACAO' },
    })

    expect(deps.activityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        opportunityId: 'op-1',
        type: 'MUDANCA_STATUS',
        previousStatus: 'ENVIADA',
        newStatus: 'EM_NEGOCIACAO',
        authorId: 'user-1',
        authorName: 'Ana',
      }),
    )
  })

  it('rejeita uma transição de status inválida e não toca no repositório', async () => {
    const update = vi.fn()
    const deps = createDeps({ update })
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      deps.propertyLookup,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'ADMIN',
        opportunityId: 'op-1',
        changes: { status: 'RASCUNHO' },
      }),
    ).rejects.toThrow(InvalidStatusTransitionError)
    expect(update).not.toHaveBeenCalled()
    expect(deps.activityRepository.create).not.toHaveBeenCalled()
  })

  it('não registra atividade quando a atualização não muda o status', async () => {
    const deps = createDeps()
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      deps.propertyLookup,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      opportunityId: 'op-1',
      changes: { notes: 'Aceita animais.' },
    })

    expect(deps.activityRepository.create).not.toHaveBeenCalled()
  })

  it('AGENT responsável pelo imóvel pode atualizar a oportunidade', async () => {
    const update = vi.fn().mockResolvedValue({ ...opportunity, leadName: 'Maria Silva' })
    const deps = createDeps({ update, findResponsavelId: vi.fn().mockResolvedValue('agent-1') })
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      deps.propertyLookup,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorPapel: 'AGENT',
      opportunityId: 'op-1',
      changes: { leadName: 'Maria Silva' },
    })

    expect(update).toHaveBeenCalled()
  })

  it('AGENT que não é responsável pelo imóvel recebe 404 opaco e não atualiza', async () => {
    const update = vi.fn()
    const deps = createDeps({
      update,
      findResponsavelId: vi.fn().mockResolvedValue('outro-agente'),
    })
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      deps.propertyLookup,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorPapel: 'AGENT',
        opportunityId: 'op-1',
        changes: { leadName: 'Maria Silva' },
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(update).not.toHaveBeenCalled()
  })
})
