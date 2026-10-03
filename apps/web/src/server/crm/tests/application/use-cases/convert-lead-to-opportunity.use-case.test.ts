import { describe, expect, it, vi } from 'vitest'

import {
  LeadAlreadyConvertedError,
  LeadNotFoundError,
  OpportunityPropertyNotFoundError,
} from '../../../domain/errors'
import type { Lead } from '../../../domain/lead.entity'
import type { Opportunity } from '../../../domain/opportunity.entity'
import type { LeadRepository } from '../../../application/ports/lead-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../../../application/ports/property-lookup.port'
import { ConvertLeadToOpportunityUseCase } from '../../../application/use-cases/convert-lead-to-opportunity.use-case'

const lead: Lead = {
  id: 'lead-1',
  tenantId: 'tenant-1',
  responsavelId: 'agent-1',
  name: 'Maria Souza',
  phone: '(11) 99999-0000',
  email: 'maria@exemplo.com',
  interest: 'Apartamento',
  budget: 'Até R$ 3.000',
  source: 'WhatsApp',
  stage: 'VISITA_MARCADA',
  notes: 'Gostou muito da varanda.',
  opportunityId: null,
  createdAt: new Date('2026-09-21T00:00:00.000Z'),
  updatedAt: new Date('2026-09-21T00:00:00.000Z'),
}

const opportunity = { id: 'opportunity-1' } as Opportunity

function buildRepos(overrides?: {
  lead?: Partial<LeadRepository>
  opportunity?: Partial<OpportunityRepository>
  propertyLookup?: Partial<PropertyLookupPort>
}) {
  const leadRepository = {
    findById: vi.fn().mockResolvedValue(lead),
    markConverted: vi
      .fn()
      .mockResolvedValue({ ...lead, stage: 'PROPOSTA', opportunityId: opportunity.id }),
    ...overrides?.lead,
  } as unknown as LeadRepository

  const opportunityRepository = {
    create: vi.fn().mockResolvedValue(opportunity),
    ...overrides?.opportunity,
  } as unknown as OpportunityRepository

  const propertyLookup = {
    existsForTenant: vi.fn().mockResolvedValue(true),
    findResponsavelId: vi.fn().mockResolvedValue('agent-1'),
    ...overrides?.propertyLookup,
  } as unknown as PropertyLookupPort

  return { leadRepository, opportunityRepository, propertyLookup }
}

describe('ConvertLeadToOpportunityUseCase', () => {
  it('cria a oportunidade a partir dos dados do lead e marca o lead como convertido', async () => {
    const { leadRepository, opportunityRepository, propertyLookup } = buildRepos()
    const useCase = new ConvertLeadToOpportunityUseCase(
      leadRepository,
      opportunityRepository,
      propertyLookup,
    )

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorPapel: 'AGENT',
      leadId: 'lead-1',
      propertyId: 'property-1',
      proposedValue: 3000,
    })

    expect(opportunityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        propertyId: 'property-1',
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        proposedValue: 3000,
        notes: lead.notes,
        status: 'RASCUNHO',
      }),
    )
    expect(leadRepository.markConverted).toHaveBeenCalledWith('lead-1', 'opportunity-1')
    expect(result.opportunity).toEqual(opportunity)
  })

  it('rejeita converter um lead já convertido', async () => {
    const { leadRepository, opportunityRepository, propertyLookup } = buildRepos({
      lead: { findById: vi.fn().mockResolvedValue({ ...lead, opportunityId: 'opportunity-0' }) },
    })
    const useCase = new ConvertLeadToOpportunityUseCase(
      leadRepository,
      opportunityRepository,
      propertyLookup,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorPapel: 'AGENT',
        leadId: 'lead-1',
        propertyId: 'property-1',
        proposedValue: 3000,
      }),
    ).rejects.toThrow(LeadAlreadyConvertedError)
    expect(opportunityRepository.create).not.toHaveBeenCalled()
  })

  it('rejeita um imóvel que não pertence ao tenant', async () => {
    const { leadRepository, opportunityRepository, propertyLookup } = buildRepos({
      propertyLookup: { existsForTenant: vi.fn().mockResolvedValue(false) },
    })
    const useCase = new ConvertLeadToOpportunityUseCase(
      leadRepository,
      opportunityRepository,
      propertyLookup,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorPapel: 'AGENT',
        leadId: 'lead-1',
        propertyId: 'property-de-outro-tenant',
        proposedValue: 3000,
      }),
    ).rejects.toThrow(OpportunityPropertyNotFoundError)
    expect(opportunityRepository.create).not.toHaveBeenCalled()
  })

  it('bloqueia AGENT convertendo com um imóvel do qual não é responsável', async () => {
    const { leadRepository, opportunityRepository, propertyLookup } = buildRepos({
      propertyLookup: { findResponsavelId: vi.fn().mockResolvedValue('agent-2') },
    })
    const useCase = new ConvertLeadToOpportunityUseCase(
      leadRepository,
      opportunityRepository,
      propertyLookup,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorPapel: 'AGENT',
        leadId: 'lead-1',
        propertyId: 'property-1',
        proposedValue: 3000,
      }),
    ).rejects.toThrow('Você só pode criar oportunidades para os próprios imóveis.')
    expect(opportunityRepository.create).not.toHaveBeenCalled()
  })

  it('lança LeadNotFoundError (404 opaco) para AGENT que não é o responsável pelo lead', async () => {
    const { leadRepository, opportunityRepository, propertyLookup } = buildRepos()
    const useCase = new ConvertLeadToOpportunityUseCase(
      leadRepository,
      opportunityRepository,
      propertyLookup,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-2',
        actorPapel: 'AGENT',
        leadId: 'lead-1',
        propertyId: 'property-1',
        proposedValue: 3000,
      }),
    ).rejects.toThrow(LeadNotFoundError)
    expect(opportunityRepository.create).not.toHaveBeenCalled()
  })
})
