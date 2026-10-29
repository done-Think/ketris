import { describe, expect, it, vi } from 'vitest'

import { assertAgentOwnsContact, assertOpportunityAccess } from '../../application/authorization'
import type { OpportunityRepository } from '../../application/ports/opportunity-repository.port'
import { ContactNotFoundError, OpportunityNotFoundError } from '../../domain/errors'

describe('assertOpportunityAccess', () => {
  it('não restringe o OWNER', () => {
    expect(() =>
      assertOpportunityAccess({ responsibleId: 'outro' }, 'actor-1', 'OWNER'),
    ).not.toThrow()
  })

  it('libera o AGENT responsável pela oportunidade', () => {
    expect(() =>
      assertOpportunityAccess({ responsibleId: 'actor-1' }, 'actor-1', 'AGENT'),
    ).not.toThrow()
  })

  it('bloqueia o AGENT que não é o responsável, mesmo dono do imóvel', () => {
    expect(() =>
      assertOpportunityAccess({ responsibleId: 'outro-agente' }, 'actor-1', 'AGENT'),
    ).toThrow(OpportunityNotFoundError)
  })

  it('bloqueia um RENTER sempre', () => {
    expect(() =>
      assertOpportunityAccess({ responsibleId: 'actor-1' }, 'actor-1', 'RENTER'),
    ).toThrow(OpportunityNotFoundError)
  })
})

describe('assertAgentOwnsContact', () => {
  it('não restringe o OWNER', async () => {
    const opportunityRepository = { existsForAgent: vi.fn() } as unknown as OpportunityRepository

    await expect(
      assertAgentOwnsContact(opportunityRepository, 't1', 'c1', 'actor-1', 'OWNER'),
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
