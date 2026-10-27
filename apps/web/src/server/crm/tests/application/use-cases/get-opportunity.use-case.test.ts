import { describe, expect, it, vi } from 'vitest'

import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { GetOpportunityUseCase } from '../../../application/use-cases/get-opportunity.use-case'
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

function createUseCase(responsibleId = 'agent-1') {
  const repository = {
    findById: vi.fn().mockResolvedValue({ ...opportunity, responsibleId }),
  } as unknown as OpportunityRepository

  return { repository, useCase: new GetOpportunityUseCase(repository) }
}

describe('GetOpportunityUseCase', () => {
  it('retorna a oportunidade quando pertence ao tenant do ator (OWNER)', async () => {
    const { useCase } = createUseCase()

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'OWNER',
      opportunityId: 'op-1',
    })

    expect(result).toEqual(opportunity)
  })

  it('OWNER não sofre nenhuma restrição', async () => {
    const { useCase } = createUseCase('outro-agente')

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'OWNER',
      opportunityId: 'op-1',
    })

    expect(result).toMatchObject({ id: 'op-1', responsibleId: 'outro-agente' })
  })

  it('lança OpportunityNotFoundError quando a oportunidade não existe', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as OpportunityRepository
    const useCase = new GetOpportunityUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorPapel: 'OWNER',
        opportunityId: 'inexistente',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
  })

  it('lança OpportunityNotFoundError (opaco) quando a oportunidade é de outro tenant', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({ ...opportunity, tenantId: 'tenant-2' }),
    } as unknown as OpportunityRepository
    const useCase = new GetOpportunityUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorPapel: 'OWNER',
        opportunityId: 'op-1',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
  })

  it('AGENT responsável pela oportunidade consegue ver a oportunidade', async () => {
    const { useCase } = createUseCase()

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorPapel: 'AGENT',
      opportunityId: 'op-1',
    })

    expect(result).toEqual(opportunity)
  })

  it('AGENT que não é responsável pela oportunidade recebe 404 opaco', async () => {
    const { useCase } = createUseCase('outro-agente')

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorPapel: 'AGENT',
        opportunityId: 'op-1',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
  })
})
