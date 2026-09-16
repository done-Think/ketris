import { describe, expect, it, vi } from 'vitest'

import type { Contact } from '../../../domain/contact.entity'
import type { ContactRepository } from '../../../application/ports/contact-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import { ListContactsUseCase } from '../../../application/use-cases/list-contacts.use-case'

const contactA: Contact = {
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

const contactB: Contact = {
  ...contactA,
  id: 'contato-2',
  name: 'Beatriz',
  email: 'beatriz@exemplo.com',
}

describe('ListContactsUseCase', () => {
  it('retorna lista vazia sem consultar oportunidades quando não há contatos', async () => {
    const findManyByTenant = vi.fn().mockResolvedValue([])
    const countByContact = vi.fn()
    const contactRepository = { findManyByTenant } as unknown as ContactRepository
    const opportunityRepository = { countByContact } as unknown as OpportunityRepository
    const useCase = new ListContactsUseCase(contactRepository, opportunityRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'ADMIN',
    })

    expect(result).toEqual([])
    expect(countByContact).not.toHaveBeenCalled()
  })

  it('enriquece cada contato com o total de oportunidades ativas (sem recorte pra ADMIN)', async () => {
    const findManyByTenant = vi.fn().mockResolvedValue([contactA, contactB])
    const countByContact = vi.fn().mockResolvedValue(new Map([['contato-1', 3]]))
    const contactRepository = { findManyByTenant } as unknown as ContactRepository
    const opportunityRepository = { countByContact } as unknown as OpportunityRepository
    const useCase = new ListContactsUseCase(contactRepository, opportunityRepository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorPapel: 'ADMIN',
    })

    expect(findManyByTenant).toHaveBeenCalledWith('tenant-1', {})
    expect(countByContact).toHaveBeenCalledWith('tenant-1', ['contato-1', 'contato-2'])
    expect(result).toEqual([
      { ...contactA, propertyCount: 3 },
      { ...contactB, propertyCount: 0 },
    ])
  })

  it('AGENT tem a listagem escopada pelo próprio id, via responsavelId', async () => {
    const findManyByTenant = vi.fn().mockResolvedValue([contactA])
    const countByContact = vi.fn().mockResolvedValue(new Map())
    const contactRepository = { findManyByTenant } as unknown as ContactRepository
    const opportunityRepository = { countByContact } as unknown as OpportunityRepository
    const useCase = new ListContactsUseCase(contactRepository, opportunityRepository)

    await useCase.execute({ actorTenantId: 'tenant-1', actorId: 'agent-1', actorPapel: 'AGENT' })

    expect(findManyByTenant).toHaveBeenCalledWith('tenant-1', { responsavelId: 'agent-1' })
  })
})
