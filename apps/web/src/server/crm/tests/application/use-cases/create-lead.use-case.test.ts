import { describe, expect, it, vi } from 'vitest'

import type { LeadRepository } from '../../../application/ports/lead-repository.port'
import { CreateLeadUseCase } from '../../../application/use-cases/create-lead.use-case'
import type { Lead } from '../../../domain/lead.entity'

const created: Lead = {
  id: 'lead-1',
  tenantId: 'tenant-1',
  responsibleId: 'agent-1',
  name: 'Maria Souza',
  phone: '(11) 99999-0000',
  email: 'maria@exemplo.com',
  interest: 'Apartamento 2 quartos na Vila Mariana',
  budget: 'Até R$ 3.000',
  source: 'WHATSAPP',
  stage: 'NEW',
  notes: null,
  opportunityId: null,
  createdAt: new Date('2026-09-21T00:00:00.000Z'),
  updatedAt: new Date('2026-09-21T00:00:00.000Z'),
}

describe('CreateLeadUseCase', () => {
  it('uses the selected available property and its responsible agent instead of trusting the submitted title', async () => {
    const create = vi.fn().mockResolvedValue(created)
    const findAvailable = vi
      .fn()
      .mockResolvedValue({ id: 'property-1', title: 'Imóvel cadastrado', responsibleId: 'agent-1' })
    const useCase = new CreateLeadUseCase({ create } as unknown as LeadRepository, {
      findAvailable,
    })
    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'owner-1',
      actorRole: 'OWNER',
      name: 'Interessado',
      phone: '(11) 99999-0000',
      propertyId: 'property-1',
      interest: 'Título adulterado',
      budget: 'Até R$ 3.000',
      source: 'OTHER',
    })
    expect(findAvailable).toHaveBeenCalledWith('tenant-1', 'property-1', undefined)
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: 'property-1',
        interest: 'Imóvel cadastrado',
        responsibleId: 'agent-1',
      }),
    )
  })

  it('restricts an agent lookup to their own available properties and rejects stale or inaccessible selections', async () => {
    const create = vi.fn()
    const findAvailable = vi.fn().mockResolvedValue(null)
    const useCase = new CreateLeadUseCase({ create } as unknown as LeadRepository, {
      findAvailable,
    })
    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorRole: 'AGENT',
        name: 'Interessado',
        phone: '(11) 99999-0000',
        propertyId: 'property-2',
        interest: 'Imóvel',
        budget: 'Até R$ 3.000',
        source: 'OTHER',
      }),
    ).rejects.toMatchObject({ code: 'OPPORTUNITY_PROPERTY_NOT_FOUND' })
    expect(findAvailable).toHaveBeenCalledWith('tenant-1', 'property-2', 'agent-1')
    expect(create).not.toHaveBeenCalled()
  })
  it('cria o lead com o ator autenticado como responsável', async () => {
    const create = vi.fn().mockResolvedValue(created)
    const repository = { create } as unknown as LeadRepository
    const useCase = new CreateLeadUseCase(repository, { findAvailable: vi.fn() })

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorRole: 'AGENT',
      name: 'Maria Souza',
      phone: '(11) 99999-0000',
      interest: 'Apartamento 2 quartos na Vila Mariana',
      budget: 'Até R$ 3.000',
      source: 'WHATSAPP',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', responsibleId: 'agent-1' }),
    )
    expect(result).toEqual(created)
  })

  it('bloqueia RENTER ao tentar criar um lead', async () => {
    const create = vi.fn()
    const repository = { create } as unknown as LeadRepository
    const useCase = new CreateLeadUseCase(repository, { findAvailable: vi.fn() })

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'renter-1',
        actorRole: 'RENTER',
        name: 'Maria Souza',
        phone: '(11) 99999-0000',
        interest: 'Apartamento',
        budget: 'Até R$ 3.000',
        source: 'WHATSAPP',
      }),
    ).rejects.toThrow('Só a equipe da imobiliária acessa o CRM.')
    expect(create).not.toHaveBeenCalled()
  })
})
