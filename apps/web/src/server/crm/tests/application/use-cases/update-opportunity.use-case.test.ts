import { describe, expect, it, vi } from 'vitest'
import type { ContactRepository } from '../../../application/ports/contact-repository.port'

import type { ActivityRepository } from '../../../application/ports/activity-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { UpdateOpportunityUseCase } from '../../../application/use-cases/update-opportunity.use-case'
import { InvalidStatusTransitionError, OpportunityNotFoundError } from '../../../domain/errors'
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
  guaranteeType: 'NONE',
  specialConditions: [],
  notes: null,
  status: 'SENT',
  archivedAt: null,
  createdAt: new Date('2026-08-10T00:00:00.000Z'),
  updatedAt: new Date('2026-08-10T00:00:00.000Z'),
}

function createDeps(overrides?: {
  findById?: OpportunityRepository['findById']
  update?: OpportunityRepository['update']
}) {
  const opportunityRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(opportunity),
    update:
      overrides?.update ?? vi.fn().mockResolvedValue({ ...opportunity, status: 'IN_NEGOTIATION' }),
  } as unknown as OpportunityRepository

  const activityRepository = {
    create: vi.fn().mockResolvedValue({}),
  } as unknown as ActivityRepository

  return { opportunityRepository, activityRepository }
}

describe('UpdateOpportunityUseCase', () => {
  it('atualiza a oportunidade do tenant do ator repassando as mudanças', async () => {
    const update = vi.fn().mockResolvedValue({ ...opportunity, leadName: 'Maria Silva' })
    const deps = createDeps({ update })
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      {} as ContactRepository,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
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
      {} as ContactRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'OWNER',
        opportunityId: 'op-1',
        changes: { status: 'ACCEPTED' },
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(update).not.toHaveBeenCalled()
  })

  it('permite uma transição de status válida e registra a mudança na timeline', async () => {
    const update = vi.fn().mockResolvedValue({ ...opportunity, status: 'IN_NEGOTIATION' })
    const deps = createDeps({ update })
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      {} as ContactRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
      actorId: 'user-1',
      actorName: 'Ana',
      opportunityId: 'op-1',
      changes: { status: 'IN_NEGOTIATION' },
    })

    expect(deps.activityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        opportunityId: 'op-1',
        type: 'STATUS_CHANGE',
        previousStatus: 'SENT',
        newStatus: 'IN_NEGOTIATION',
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
      {} as ContactRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'OWNER',
        opportunityId: 'op-1',
        changes: { status: 'DRAFT' },
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
      {} as ContactRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
      opportunityId: 'op-1',
      changes: { notes: 'Aceita animais.' },
    })

    expect(deps.activityRepository.create).not.toHaveBeenCalled()
  })

  it('AGENT responsável pela oportunidade pode atualizar a oportunidade', async () => {
    const update = vi.fn().mockResolvedValue({ ...opportunity, leadName: 'Maria Silva' })
    const deps = createDeps({ update })
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      {} as ContactRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorRole: 'AGENT',
      opportunityId: 'op-1',
      changes: { leadName: 'Maria Silva' },
    })

    expect(update).toHaveBeenCalled()
  })

  it('AGENT que não é responsável pela oportunidade recebe 404 opaco e não atualiza', async () => {
    const update = vi.fn()
    const deps = createDeps({
      update,
    })
    const useCase = new UpdateOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
      {} as ContactRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-2',
        actorRole: 'AGENT',
        opportunityId: 'op-1',
        changes: { leadName: 'Maria Silva' },
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(update).not.toHaveBeenCalled()
  })
})
