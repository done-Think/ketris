import { describe, expect, it, vi } from 'vitest'

import { ContactEmailAlreadyExistsError } from '../../../domain/errors'
import type { Contact } from '../../../domain/contact.entity'
import type { ContactRepository } from '../../../application/ports/contact-repository.port'
import { CreateContactUseCase } from '../../../application/use-cases/create-contact.use-case'

const existing: Contact = {
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

describe('CreateContactUseCase', () => {
  it('normaliza o e-mail para minúsculas antes de checar duplicidade e criar', async () => {
    const findByEmail = vi.fn().mockResolvedValue(null)
    const create = vi.fn().mockResolvedValue({ ...existing, email: 'novo@exemplo.com' })
    const repository = { findByEmail, create } as unknown as ContactRepository
    const useCase = new CreateContactUseCase(repository)

    await useCase.execute({
      actorTenantId: 'tenant-1',
      name: 'Novo Contato',
      email: 'Novo@Exemplo.com',
      phone: null,
      type: 'LOCATARIO',
      avatarUrl: null,
      notes: null,
    })

    expect(findByEmail).toHaveBeenCalledWith('tenant-1', 'novo@exemplo.com')
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'novo@exemplo.com', tenantId: 'tenant-1' }),
    )
  })

  it('lança ContactEmailAlreadyExistsError e não cria quando o e-mail já existe no tenant', async () => {
    const findByEmail = vi.fn().mockResolvedValue(existing)
    const create = vi.fn()
    const repository = { findByEmail, create } as unknown as ContactRepository
    const useCase = new CreateContactUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        name: 'Duplicado',
        email: 'carlos@exemplo.com',
        phone: null,
        type: 'LOCATARIO',
        avatarUrl: null,
        notes: null,
      }),
    ).rejects.toThrow(ContactEmailAlreadyExistsError)
    expect(create).not.toHaveBeenCalled()
  })
})
