import { describe, expect, it, vi } from 'vitest'

import { ContactNotFoundError } from '../../../domain/errors'
import type { Contact } from '../../../domain/contact.entity'
import type { ContactRepository } from '../../../application/ports/contact-repository.port'
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

describe('GetContactUseCase', () => {
  it('retorna o contato quando pertence ao tenant do ator', async () => {
    const findById = vi.fn().mockResolvedValue(contact)
    const repository = { findById } as unknown as ContactRepository
    const useCase = new GetContactUseCase(repository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', contactId: 'contato-1' })

    expect(result).toEqual(contact)
  })

  it('lança ContactNotFoundError (opaco) quando é de outro tenant', async () => {
    const findById = vi.fn().mockResolvedValue({ ...contact, tenantId: 'tenant-2' })
    const repository = { findById } as unknown as ContactRepository
    const useCase = new GetContactUseCase(repository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', contactId: 'contato-1' }),
    ).rejects.toThrow(ContactNotFoundError)
  })
})
