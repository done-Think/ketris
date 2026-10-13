import { describe, expect, it, vi } from 'vitest'

import type { Lead } from '../../../domain/lead.entity'
import type { LeadRepository } from '../../../application/ports/lead-repository.port'
import { CreateLeadUseCase } from '../../../application/use-cases/create-lead.use-case'

const created: Lead = {
  id: 'lead-1',
  tenantId: 'tenant-1',
  responsavelId: 'agent-1',
  name: 'Maria Souza',
  phone: '(11) 99999-0000',
  email: 'maria@exemplo.com',
  interest: 'Apartamento 2 quartos na Vila Mariana',
  budget: 'Até R$ 3.000',
  source: 'WhatsApp',
  stage: 'NOVO',
  notes: null,
  opportunityId: null,
  createdAt: new Date('2026-09-21T00:00:00.000Z'),
  updatedAt: new Date('2026-09-21T00:00:00.000Z'),
}

describe('CreateLeadUseCase', () => {
  it('cria o lead com o ator autenticado como responsável', async () => {
    const create = vi.fn().mockResolvedValue(created)
    const repository = { create } as unknown as LeadRepository
    const useCase = new CreateLeadUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorPapel: 'AGENT',
      name: 'Maria Souza',
      phone: '(11) 99999-0000',
      interest: 'Apartamento 2 quartos na Vila Mariana',
      budget: 'Até R$ 3.000',
      source: 'WhatsApp',
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-1', responsavelId: 'agent-1' }),
    )
    expect(result).toEqual(created)
  })

  it('bloqueia RENTER ao tentar criar um lead', async () => {
    const create = vi.fn()
    const repository = { create } as unknown as LeadRepository
    const useCase = new CreateLeadUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'renter-1',
        actorPapel: 'RENTER',
        name: 'Maria Souza',
        phone: '(11) 99999-0000',
        interest: 'Apartamento',
        budget: 'Até R$ 3.000',
        source: 'WhatsApp',
      }),
    ).rejects.toThrow('Locatários não podem gerenciar leads.')
    expect(create).not.toHaveBeenCalled()
  })
})
