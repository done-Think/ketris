import { describe, expect, it, vi } from 'vitest'

import type { LeadRepository } from '../../../application/ports/lead-repository.port'
import { UpdateLeadUseCase } from '../../../application/use-cases/update-lead.use-case'
import { LeadNotFoundError } from '../../../domain/errors'
import type { Lead } from '../../../domain/lead.entity'

const lead: Lead = {
  id: 'lead-1',
  tenantId: 'tenant-1',
  responsibleId: 'agent-1',
  name: 'Maria Souza',
  phone: '(11) 99999-0000',
  email: null,
  interest: 'Apartamento',
  budget: 'Até R$ 3.000',
  source: 'WHATSAPP',
  stage: 'NEW',
  notes: null,
  opportunityId: null,
  createdAt: new Date('2026-09-21T00:00:00.000Z'),
  updatedAt: new Date('2026-09-21T00:00:00.000Z'),
}

describe('UpdateLeadUseCase', () => {
  it('atualiza o estágio quando o ator é o responsável', async () => {
    const findById = vi.fn().mockResolvedValue(lead)
    const update = vi.fn().mockResolvedValue({ ...lead, stage: 'IN_CONTACT' })
    const repository = { findById, update } as unknown as LeadRepository
    const useCase = new UpdateLeadUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorRole: 'AGENT',
      leadId: 'lead-1',
      changes: { stage: 'IN_CONTACT' },
    })

    expect(update).toHaveBeenCalledWith('lead-1', { stage: 'IN_CONTACT' })
    expect(result.stage).toBe('IN_CONTACT')
  })

  it('bloqueia AGENT que não é o responsável (404 opaco) e não atualiza', async () => {
    const findById = vi.fn().mockResolvedValue(lead)
    const update = vi.fn()
    const repository = { findById, update } as unknown as LeadRepository
    const useCase = new UpdateLeadUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-2',
        actorRole: 'AGENT',
        leadId: 'lead-1',
        changes: { stage: 'PROPOSAL' },
      }),
    ).rejects.toThrow(LeadNotFoundError)
    expect(update).not.toHaveBeenCalled()
  })

  it('lança LeadNotFoundError para lead inexistente', async () => {
    const findById = vi.fn().mockResolvedValue(null)
    const update = vi.fn()
    const repository = { findById, update } as unknown as LeadRepository
    const useCase = new UpdateLeadUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorRole: 'AGENT',
        leadId: 'lead-inexistente',
        changes: { notes: 'Ligou de volta' },
      }),
    ).rejects.toThrow(LeadNotFoundError)
  })
})
