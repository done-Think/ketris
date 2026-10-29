import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import type { LeadRepository } from '../../../application/ports/lead-repository.port'
import { GetLeadUseCase } from '../../../application/use-cases/get-lead.use-case'
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

describe('GetLeadUseCase', () => {
  it('retorna o lead quando o ator é o responsável', async () => {
    const findById = vi.fn().mockResolvedValue(lead)
    const repository = { findById } as unknown as LeadRepository
    const useCase = new GetLeadUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorRole: 'AGENT',
      leadId: 'lead-1',
    })

    expect(result).toEqual(lead)
  })

  it('lança LeadNotFoundError para lead de outro tenant', async () => {
    const findById = vi.fn().mockResolvedValue({ ...lead, tenantId: 'tenant-2' })
    const repository = { findById } as unknown as LeadRepository
    const useCase = new GetLeadUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorRole: 'AGENT',
        leadId: 'lead-1',
      }),
    ).rejects.toThrow(LeadNotFoundError)
  })

  it('lança LeadNotFoundError (404 opaco) para AGENT que não é o responsável', async () => {
    const findById = vi.fn().mockResolvedValue(lead)
    const repository = { findById } as unknown as LeadRepository
    const useCase = new GetLeadUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-2',
        actorRole: 'AGENT',
        leadId: 'lead-1',
      }),
    ).rejects.toThrow(LeadNotFoundError)
  })

  it('OWNER vê o lead de qualquer corretor do tenant', async () => {
    const findById = vi.fn().mockResolvedValue(lead)
    const repository = { findById } as unknown as LeadRepository
    const useCase = new GetLeadUseCase(repository)

    const result = await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'admin-1',
      actorRole: 'OWNER',
      leadId: 'lead-1',
    })

    expect(result).toEqual(lead)
  })

  it.each(['RENTER', 'PROPERTY_OWNER'] as const)('%s não acessa o CRM', async (actorRole) => {
    const findById = vi.fn().mockResolvedValue(lead)
    const repository = { findById } as unknown as LeadRepository
    const useCase = new GetLeadUseCase(repository)

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'external-1',
        actorRole,
        leadId: 'lead-1',
      }),
    ).rejects.toThrow(ForbiddenError)
    expect(findById).not.toHaveBeenCalled()
  })
})
