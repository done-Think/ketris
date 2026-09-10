import { describe, expect, it, vi } from 'vitest'

import { ContactEmailAlreadyExistsError, ContactNotFoundError } from '../../../domain/errors'
import type { Contact } from '../../../domain/contact.entity'
import type { ContactRepository } from '../../../application/ports/contact-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { UpdateContactUseCase } from '../../../application/use-cases/update-contact.use-case'

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

describe('UpdateContactUseCase', () => {
  it('atualiza campos sem tocar em findByEmail quando o e-mail não muda', async () => {
    const findById = vi.fn().mockResolvedValue(contact)
    const findByEmail = vi.fn()
    const update = vi.fn().mockResolvedValue({ ...contact, name: 'Carlos Silva' })
    const repository = { findById, findByEmail, update } as unknown as ContactRepository
    const useCase = new UpdateContactUseCase(repository, createOpportunityRepository())

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'ADMIN',
      contactId: 'contato-1',
      changes: { name: 'Carlos Silva' },
    })

    expect(findByEmail).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith('contato-1', { name: 'Carlos Silva' })
  })

  it('lança ContactNotFoundError quando o contato é de outro tenant', async () => {
    const findById = vi.fn().mockResolvedValue({ ...contact, tenantId: 'tenant-2' })
    const update = vi.fn()
    const repository = { findById, update } as unknown as ContactRepository
    const useCase = new UpdateContactUseCase(repository, createOpportunityRepository())

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorPapel: 'ADMIN',
        contactId: 'contato-1',
        changes: {},
      }),
    ).rejects.toThrow(ContactNotFoundError)
    expect(update).not.toHaveBeenCalled()
  })

  it('normaliza e checa duplicidade quando o e-mail muda, permitindo se for único', async () => {
    const findById = vi.fn().mockResolvedValue(contact)
    const findByEmail = vi.fn().mockResolvedValue(null)
    const update = vi.fn().mockResolvedValue({ ...contact, email: 'novo@exemplo.com' })
    const repository = { findById, findByEmail, update } as unknown as ContactRepository
    const useCase = new UpdateContactUseCase(repository, createOpportunityRepository())

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'ADMIN',
      contactId: 'contato-1',
      changes: { email: 'Novo@Exemplo.com' },
    })

    expect(findByEmail).toHaveBeenCalledWith('tenant-1', 'novo@exemplo.com')
    expect(update).toHaveBeenCalledWith('contato-1', { email: 'novo@exemplo.com' })
  })

  it('lança ContactEmailAlreadyExistsError quando o novo e-mail já pertence a outro contato', async () => {
    const findById = vi.fn().mockResolvedValue(contact)
    const findByEmail = vi.fn().mockResolvedValue({ ...contact, id: 'contato-2' })
    const update = vi.fn()
    const repository = { findById, findByEmail, update } as unknown as ContactRepository
    const useCase = new UpdateContactUseCase(repository, createOpportunityRepository())

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorPapel: 'ADMIN',
        contactId: 'contato-1',
        changes: { email: 'ocupado@exemplo.com' },
      }),
    ).rejects.toThrow(ContactEmailAlreadyExistsError)
    expect(update).not.toHaveBeenCalled()
  })

  it('AGENT sem nenhuma oportunidade acessível no contato recebe 404 opaco e não atualiza', async () => {
    const findById = vi.fn().mockResolvedValue(contact)
    const update = vi.fn()
    const repository = { findById, update } as unknown as ContactRepository
    const useCase = new UpdateContactUseCase(
      repository,
      createOpportunityRepository(vi.fn().mockResolvedValue(false)),
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorPapel: 'AGENT',
        contactId: 'contato-1',
        changes: { name: 'Carlos Silva' },
      }),
    ).rejects.toThrow(ContactNotFoundError)
    expect(update).not.toHaveBeenCalled()
  })
})
