import { describe, expect, it, vi } from 'vitest'

import { OpportunityNotFoundError } from '../../../domain/errors'
import type { Opportunity } from '../../../domain/opportunity.entity'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../../../application/ports/property-lookup.port'
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

function createUseCase(findResponsavelId?: PropertyLookupPort['findResponsavelId']) {
  const repository = {
    findById: vi.fn().mockResolvedValue(opportunity),
  } as unknown as OpportunityRepository
  const propertyLookup = {
    findResponsavelId: findResponsavelId ?? vi.fn().mockResolvedValue('agent-1'),
  } as unknown as PropertyLookupPort

  return {
    repository,
    propertyLookup,
    useCase: new GetOpportunityUseCase(repository, propertyLookup),
  }
}

describe('GetOpportunityUseCase', () => {
  it('retorna a oportunidade quando pertence ao tenant do ator (ADMIN)', async () => {
    const { useCase } = createUseCase()

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'ADMIN',
      opportunityId: 'op-1',
    })

    expect(result).toEqual(opportunity)
  })

  it('OWNER não sofre nenhuma restrição', async () => {
    const { useCase } = createUseCase(vi.fn().mockResolvedValue('outro-agente'))

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'OWNER',
      opportunityId: 'op-1',
    })

    expect(result).toEqual(opportunity)
  })

  it('lança OpportunityNotFoundError quando a oportunidade não existe', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as OpportunityRepository
    const propertyLookup = {} as unknown as PropertyLookupPort
    const useCase = new GetOpportunityUseCase(repository, propertyLookup)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorPapel: 'ADMIN',
        opportunityId: 'inexistente',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
  })

  it('lança OpportunityNotFoundError (opaco) quando a oportunidade é de outro tenant', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({ ...opportunity, tenantId: 'tenant-2' }),
    } as unknown as OpportunityRepository
    const propertyLookup = {} as unknown as PropertyLookupPort
    const useCase = new GetOpportunityUseCase(repository, propertyLookup)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorPapel: 'ADMIN',
        opportunityId: 'op-1',
      }),
    ).rejects.toThrow(OpportunityNotFoundError)
  })

  it('AGENT responsável pelo imóvel consegue ver a oportunidade', async () => {
    const { useCase } = createUseCase(vi.fn().mockResolvedValue('agent-1'))

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorPapel: 'AGENT',
      opportunityId: 'op-1',
    })

    expect(result).toEqual(opportunity)
  })

  it('AGENT que não é responsável pelo imóvel recebe 404 opaco', async () => {
    const { useCase } = createUseCase(vi.fn().mockResolvedValue('outro-agente'))

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
