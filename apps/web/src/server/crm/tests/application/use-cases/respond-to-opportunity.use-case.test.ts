import { describe, expect, it, vi } from 'vitest'

import { OpportunityNotAnswerableError, OpportunityNotFoundError } from '../../../domain/errors'
import type { Opportunity } from '../../../domain/opportunity.entity'
import type { ActivityRepository } from '../../../application/ports/activity-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { RespondToOpportunityUseCase } from '../../../application/use-cases/respond-to-opportunity.use-case'

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
      actorId: 'user-1',
      actorName: 'Ana',
      opportunityId: 'op-1',
      action: 'ACEITAR',
    })

    expect(result.opportunity.status).toBe('ACEITA')
    expect(deps.activityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        opportunityId: 'op-1',
        type: 'PROPOSTA_RESPONDIDA',
        description: 'Proposta aceita.',
        previousStatus: 'ENVIADA',
        newStatus: 'ACEITA',
        authorId: 'user-1',
        authorName: 'Ana',
      }),
    )
    expect(result.activity.newStatus).toBe('ACEITA')
  })

  it('recusa a proposta com mensagem customizada como descrição da atividade', async () => {
    const deps = createDeps()
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      opportunityId: 'op-1',
      action: 'RECUSAR',
      message: 'Valor abaixo do mínimo aceito pelo proprietário.',
    })

    expect(result.opportunity.status).toBe('RECUSADA')
    expect(deps.activityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Valor abaixo do mínimo aceito pelo proprietário.',
        newStatus: 'RECUSADA',
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
      opportunityId: 'op-1',
      action: 'SOLICITAR_INFORMACOES',
      message: '   ',
    })

    expect(deps.activityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Solicitadas mais informações ao interessado.' }),
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
      opportunityId: 'op-1',
      action: 'SOLICITAR_INFORMACOES',
    })

    expect(result.opportunity.status).toBe('EM_NEGOCIACAO')
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
      useCase.execute({ actorTenantId: 'tenant-1', opportunityId: 'op-1', action: 'ACEITAR' }),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(deps.activityRepository.create).not.toHaveBeenCalled()
  })

  it('lança OpportunityNotAnswerableError para um rascunho — ainda não foi enviado', async () => {
    const deps = createDeps({ status: 'RASCUNHO' })
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', opportunityId: 'op-1', action: 'ACEITAR' }),
    ).rejects.toThrow(OpportunityNotAnswerableError)
    expect(deps.activityRepository.create).not.toHaveBeenCalled()
  })

  it('lança OpportunityNotAnswerableError para uma oportunidade já aceita', async () => {
    const deps = createDeps({ status: 'ACEITA' })
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', opportunityId: 'op-1', action: 'RECUSAR' }),
    ).rejects.toThrow(OpportunityNotAnswerableError)
  })

  it('permite responder novamente uma oportunidade recusada (retomar negociação)', async () => {
    const deps = createDeps({ status: 'RECUSADA' })
    const useCase = new RespondToOpportunityUseCase(
      deps.opportunityRepository,
      deps.activityRepository,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      opportunityId: 'op-1',
      action: 'SOLICITAR_INFORMACOES',
    })

    expect(result.opportunity.status).toBe('EM_NEGOCIACAO')
  })
})
