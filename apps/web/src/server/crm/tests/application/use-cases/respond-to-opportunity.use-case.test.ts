import { describe, expect, it, vi } from 'vitest'

import type { ActivityRepository } from '../../../application/ports/activity-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { RespondToOpportunityUseCase } from '../../../application/use-cases/respond-to-opportunity.use-case'
import { OpportunityNotAnswerableError, OpportunityNotFoundError } from '../../../domain/errors'
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
  status?: Opportunity['status']
  findById?: OpportunityRepository['findById']
  update?: OpportunityRepository['update']
}) {
  const current = { ...opportunity, status: overrides?.status ?? opportunity.status }

  const opportunityRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(current),
    update:
      overrides?.update ??
      vi.fn().mockImplementation((_id, changes) => ({ ...current, ...changes })),
  } as unknown as OpportunityRepository

  const activityRepository = {
    create: vi
      .fn()
      .mockImplementation((activity) => ({ id: 'act-1', createdAt: new Date(), ...activity })),
  } as unknown as ActivityRepository

  return { opportunityRepository, activityRepository, current }
}

describe('RespondToOpportunityUseCase', () => {
  it('aceita a proposta: move para ACEITA e registra a atividade', async () => {
    const deps = createDeps()
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
      actorId: 'user-1',
      actorName: 'Ana',
      opportunityId: 'op-1',
      action: 'ACCEPT',
    })

    expect(result.opportunity.status).toBe('ACCEPTED')
    expect(deps.activityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        opportunityId: 'op-1',
        type: 'PROPOSAL_ANSWERED',
        description: '',
        systemAction: 'ACCEPT',
        previousStatus: 'SENT',
        newStatus: 'ACCEPTED',
        authorId: 'user-1',
        authorName: 'Ana',
      }),
    )
    expect(result.activity.newStatus).toBe('ACCEPTED')
  })

  it('recusa a proposta com mensagem customizada como descrição da atividade', async () => {
    const deps = createDeps()
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
      opportunityId: 'op-1',
      action: 'REJECT',
      message: 'Valor abaixo do mínimo aceito pelo proprietário.',
    })

    expect(result.opportunity.status).toBe('REJECTED')
    expect(deps.activityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Valor abaixo do mínimo aceito pelo proprietário.',
        newStatus: 'REJECTED',
      }),
    )
  })

  it('ignora mensagem só com espaços e usa a descrição padrão', async () => {
    const deps = createDeps()
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
      opportunityId: 'op-1',
      action: 'REQUEST_INFORMATION',
      message: '   ',
    })

    expect(deps.activityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: '', systemAction: 'REQUEST_INFORMATION' }),
    )
  })

  it('solicitar informações move para EM_NEGOCIACAO', async () => {
    const deps = createDeps()
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
      opportunityId: 'op-1',
      action: 'REQUEST_INFORMATION',
    })

    expect(result.opportunity.status).toBe('IN_NEGOTIATION')
  })

  it('lança OpportunityNotFoundError quando a oportunidade é de outro tenant', async () => {
    const deps = createDeps({
      findById: vi.fn().mockResolvedValue({ ...opportunity, tenantId: 'tenant-2' }),
    })
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'OWNER',
        opportunityId: 'op-1',
        action: 'ACCEPT',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(deps.activityRepository.create).not.toHaveBeenCalled()
  })

  it('lança OpportunityNotAnswerableError para um rascunho — ainda não foi enviado', async () => {
    const deps = createDeps({ status: 'DRAFT' })
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'OWNER',
        opportunityId: 'op-1',
        action: 'ACCEPT',
      }),
    ).rejects.toThrow(OpportunityNotAnswerableError)
    expect(deps.activityRepository.create).not.toHaveBeenCalled()
  })

  it('lança OpportunityNotAnswerableError para uma oportunidade já aceita', async () => {
    const deps = createDeps({ status: 'ACCEPTED' })
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorRole: 'OWNER',
        opportunityId: 'op-1',
        action: 'REJECT',
      }),
    ).rejects.toThrow(OpportunityNotAnswerableError)
  })

  it('permite responder novamente uma oportunidade recusada (retomar negociação)', async () => {
    const deps = createDeps({ status: 'REJECTED' })
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
      opportunityId: 'op-1',
      action: 'REQUEST_INFORMATION',
    })

    expect(result.opportunity.status).toBe('IN_NEGOTIATION')
  })

  it('AGENT que não é responsável pela oportunidade recebe 404 opaco e não responde', async () => {
    const deps = createDeps({})
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-2',
        actorRole: 'AGENT',
        opportunityId: 'op-1',
        action: 'ACCEPT',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(deps.activityRepository.create).not.toHaveBeenCalled()
  })
})
