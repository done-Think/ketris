import { describe, expect, it, vi } from 'vitest'

import { ContactNotFoundError } from '../../../domain/errors'
import type { Contact } from '../../../domain/contact.entity'
import type { ContactRepository } from '../../../application/ports/contact-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { ArchiveContactUseCase } from '../../../application/use-cases/archive-contact.use-case'

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

describe('ArchiveContactUseCase', () => {
  it('arquiva o contato do tenant do ator', async () => {
    const findById = vi.fn().mockResolvedValue(contact)
    const archive = vi.fn().mockResolvedValue({ ...contact, archivedAt: new Date() })
    const repository = { findById, archive } as unknown as ContactRepository
    const useCase = new ArchiveContactUseCase(repository, createOpportunityRepository())

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'ADMIN',
      contactId: 'contato-1',
    })

    expect(archive).toHaveBeenCalledWith('contato-1')
    expect(result.archivedAt).not.toBeNull()
  })

  it('lança ContactNotFoundError e não arquiva quando é de outro tenant', async () => {
    const findById = vi.fn().mockResolvedValue({ ...contact, tenantId: 'tenant-2' })
    const archive = vi.fn()
    const repository = { findById, archive } as unknown as ContactRepository
    const useCase = new ArchiveContactUseCase(repository, createOpportunityRepository())

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorPapel: 'ADMIN',
        contactId: 'contato-1',
      }),
    ).rejects.toThrow(ContactNotFoundError)
    expect(archive).not.toHaveBeenCalled()
  })

  it('AGENT sem nenhuma oportunidade acessível no contato recebe 404 opaco e não arquiva', async () => {
    const findById = vi.fn().mockResolvedValue(contact)
    const archive = vi.fn()
    const repository = { findById, archive } as unknown as ContactRepository
    const useCase = new ArchiveContactUseCase(
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
    expect(archive).not.toHaveBeenCalled()
  })
})
