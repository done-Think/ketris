import { describe, expect, it, vi } from 'vitest'

import { assertAgentOwnsContact, assertAgentOwnsProperty } from '../../application/authorization'
import { ContactNotFoundError, OpportunityNotFoundError } from '../../domain/errors'
import type { OpportunityRepository } from '../../application/ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../../application/ports/property-lookup.port'

describe('assertAgentOwnsProperty', () => {
  it('não restringe ADMIN nem OWNER', async () => {
    const propertyLookup: PropertyLookupPort = {
      existsForTenant: vi.fn(),
      findResponsavelId: vi.fn(),
    }

    await expect(
      assertAgentOwnsProperty(propertyLookup, 't1', 'p1', 'actor-1', 'ADMIN'),
    ).resolves.toBeUndefined()
    await expect(
      assertAgentOwnsProperty(propertyLookup, 't1', 'p1', 'actor-1', 'OWNER'),
    ).resolves.toBeUndefined()
    expect(propertyLookup.findResponsavelId).not.toHaveBeenCalled()
  })

  it('libera o AGENT quando ele é o responsável pelo imóvel', async () => {
    const propertyLookup: PropertyLookupPort = {
      existsForTenant: vi.fn(),
      findResponsavelId: vi.fn().mockResolvedValue('actor-1'),
    }

    await expect(
      assertAgentOwnsProperty(propertyLookup, 't1', 'p1', 'actor-1', 'AGENT'),
    ).resolves.toBeUndefined()
  })

  it('bloqueia o AGENT quando ele não é o responsável pelo imóvel', async () => {
    const propertyLookup: PropertyLookupPort = {
      existsForTenant: vi.fn(),
      findResponsavelId: vi.fn().mockResolvedValue('outro-agente'),
    }

    await expect(
      assertAgentOwnsProperty(propertyLookup, 't1', 'p1', 'actor-1', 'AGENT'),
    ).rejects.toThrow(OpportunityNotFoundError)
  })

  it('bloqueia um RENTER sempre, sem nem consultar quem é o responsável', async () => {
    const propertyLookup: PropertyLookupPort = {
      existsForTenant: vi.fn(),
      findResponsavelId: vi.fn(),
    }

    await expect(
      assertAgentOwnsProperty(propertyLookup, 't1', 'p1', 'actor-1', 'RENTER'),
    ).rejects.toThrow(OpportunityNotFoundError)
    expect(propertyLookup.findResponsavelId).not.toHaveBeenCalled()
  })
})

describe('assertAgentOwnsContact', () => {
  it('não restringe ADMIN nem OWNER', async () => {
    const opportunityRepository = { existsForAgent: vi.fn() } as unknown as OpportunityRepository

    await expect(
      assertAgentOwnsContact(opportunityRepository, 't1', 'c1', 'actor-1', 'ADMIN'),
    ).resolves.toBeUndefined()
    await expect(
      assertAgentOwnsContact(opportunityRepository, 't1', 'c1', 'actor-1', 'OWNER'),
    ).resolves.toBeUndefined()
    expect(opportunityRepository.existsForAgent).not.toHaveBeenCalled()
  })

  it('libera o AGENT quando ele tem uma oportunidade ligada ao contato', async () => {
    const opportunityRepository = {
      existsForAgent: vi.fn().mockResolvedValue(true),
    } as unknown as OpportunityRepository

    await expect(
      assertAgentOwnsContact(opportunityRepository, 't1', 'c1', 'actor-1', 'AGENT'),
    ).resolves.toBeUndefined()
  })

  it('bloqueia o AGENT quando ele não tem nenhuma oportunidade ligada ao contato', async () => {
    const opportunityRepository = {
      existsForAgent: vi.fn().mockResolvedValue(false),
    } as unknown as OpportunityRepository

    await expect(
      assertAgentOwnsContact(opportunityRepository, 't1', 'c1', 'actor-1', 'AGENT'),
    ).rejects.toThrow(ContactNotFoundError)
  })

  it('bloqueia um RENTER sempre, sem nem consultar a oportunidade', async () => {
    const opportunityRepository = { existsForAgent: vi.fn() } as unknown as OpportunityRepository

    await expect(
      assertAgentOwnsContact(opportunityRepository, 't1', 'c1', 'actor-1', 'RENTER'),
    ).rejects.toThrow(ContactNotFoundError)
    expect(opportunityRepository.existsForAgent).not.toHaveBeenCalled()
  })
})
