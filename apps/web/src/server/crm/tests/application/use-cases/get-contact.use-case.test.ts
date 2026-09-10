import { describe, expect, it, vi } from 'vitest'

import { ContactNotFoundError } from '../../../domain/errors'
import type { Contact } from '../../../domain/contact.entity'
import type { ContactRepository } from '../../../application/ports/contact-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { GetContactUseCase } from '../../../application/use-cases/get-contact.use-case'

const contact: Contact = {
  id: 'contato-1',
  tenantId: 'tenant-1',
  name: 'Carlos',
  email: 'carlos@exemplo.com',
  phone: null,
  type: 'PROPRIETARIO',
  avatarUrl: null,
  notes: null,
  lastInteraction: null,
  archivedAt: null,
  createdAt: new Date('2026-08-10T00:00:00.000Z'),
  updatedAt: new Date('2026-08-10T00:00:00.000Z'),
}

function createOpportunityRepository(existsForAgent?: OpportunityRepository['existsForAgent']) {
  return {
    existsForAgent: existsForAgent ?? vi.fn().mockResolvedValue(true),
  } as unknown as OpportunityRepository
}

describe('GetContactUseCase', () => {
  it('retorna o contato quando pertence ao tenant do ator (ADMIN)', async () => {
    const findById = vi.fn().mockResolvedValue(contact)
    const repository = { findById } as unknown as ContactRepository
    const useCase = new GetContactUseCase(repository, createOpportunityRepository())

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'ADMIN',
      contactId: 'contato-1',
    })

    expect(result).toEqual(contact)
  })

  it('lança ContactNotFoundError (opaco) quando é de outro tenant', async () => {
    const findById = vi.fn().mockResolvedValue({ ...contact, tenantId: 'tenant-2' })
    const repository = { findById } as unknown as ContactRepository
    const useCase = new GetContactUseCase(repository, createOpportunityRepository())

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorPapel: 'ADMIN',
        contactId: 'contato-1',
      }),
    ).rejects.toThrow(ContactNotFoundError)
  })

  it('AGENT com uma oportunidade acessível no contato consegue vê-lo', async () => {
    const findById = vi.fn().mockResolvedValue(contact)
    const repository = { findById } as unknown as ContactRepository
    const existsForAgent = vi.fn().mockResolvedValue(true)
    const useCase = new GetContactUseCase(repository, createOpportunityRepository(existsForAgent))

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorPapel: 'AGENT',
      contactId: 'contato-1',
    })

    expect(existsForAgent).toHaveBeenCalledWith('tenant-1', 'contato-1', 'agent-1')
    expect(result).toEqual(contact)
  })

  it('AGENT sem nenhuma oportunidade acessível no contato recebe 404 opaco', async () => {
    const findById = vi.fn().mockResolvedValue(contact)
    const repository = { findById } as unknown as ContactRepository
    const useCase = new GetContactUseCase(
      repository,
      createOpportunityRepository(vi.fn().mockResolvedValue(false)),
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorPapel: 'AGENT',
        contactId: 'contato-1',
      }),
    ).rejects.toThrow(ContactNotFoundError)
  })
})
