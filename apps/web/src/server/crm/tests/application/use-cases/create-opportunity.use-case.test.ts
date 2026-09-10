import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import { ContactNotFoundError, OpportunityPropertyNotFoundError } from '../../../domain/errors'
import type { Contact } from '../../../domain/contact.entity'
import type { Opportunity } from '../../../domain/opportunity.entity'
import type { ActivityRepository } from '../../../application/ports/activity-repository.port'
import type { ContactRepository } from '../../../application/ports/contact-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../../../application/ports/property-lookup.port'
import { CreateOpportunityUseCase } from '../../../application/use-cases/create-opportunity.use-case'

const created: Opportunity = {
  id: 'op-1',
  tenantId: 'tenant-1',
  propertyId: 'imovel-1',
  contactId: null,
  leadName: 'Maria',
  leadEmail: 'maria@exemplo.com',
  leadPhone: null,
  proposedValue: 2500,
  contractTermMonths: null,
  desiredStartDate: null,
  guaranteeType: 'NENHUMA',
  specialConditions: [],
  notes: null,
  status: 'RASCUNHO',
  archivedAt: null,
  createdAt: new Date('2026-08-10T00:00:00.000Z'),
  updatedAt: new Date('2026-08-10T00:00:00.000Z'),
}

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

function createDeps(overrides?: {
  existsForTenant?: PropertyLookupPort['existsForTenant']
  findResponsavelId?: PropertyLookupPort['findResponsavelId']
  findById?: ContactRepository['findById']
  create?: OpportunityRepository['create']
}) {
  const opportunityRepository = {
    create: overrides?.create ?? vi.fn().mockResolvedValue(created),
  } as unknown as OpportunityRepository

  const contactRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(contact),
  } as unknown as ContactRepository

  const propertyLookup = {
    existsForTenant: overrides?.existsForTenant ?? vi.fn().mockResolvedValue(true),
    findResponsavelId: overrides?.findResponsavelId ?? vi.fn().mockResolvedValue('agent-1'),
  } as unknown as PropertyLookupPort

  const activityRepository = {
    create: vi.fn().mockResolvedValue({}),
  } as unknown as ActivityRepository

  return { opportunityRepository, contactRepository, propertyLookup, activityRepository }
}

describe('CreateOpportunityUseCase', () => {
  it('cria a oportunidade no tenant do ator, com RASCUNHO como status padrão', async () => {
    const create = vi.fn().mockResolvedValue(created)
    const deps = createDeps({ create })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      actorId: 'user-1',
      actorName: 'Ana',
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      proposedValue: 2500,
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        propertyId: 'imovel-1',
        contactId: null,
        status: 'RASCUNHO',
      }),
    )
  })

  it('registra uma atividade NOTA marcando a criação manual', async () => {
    const deps = createDeps()
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      proposedValue: 2500,
    })

    expect(deps.activityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'NOTA', description: 'Oportunidade criada manualmente.' }),
    )
  })

  it('respeita um status inicial explícito (ENVIADA)', async () => {
    const create = vi.fn().mockResolvedValue({ ...created, status: 'ENVIADA' })
    const deps = createDeps({ create })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      proposedValue: 2500,
      status: 'ENVIADA',
    })

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ status: 'ENVIADA' }))
  })

  it('lança OpportunityPropertyNotFoundError quando o imóvel não pertence ao tenant do ator', async () => {
    const create = vi.fn()
    const deps = createDeps({ existsForTenant: vi.fn().mockResolvedValue(false), create })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'ADMIN',
        propertyId: 'imovel-de-outro-tenant',
        leadName: 'Maria',
        leadEmail: 'maria@exemplo.com',
        proposedValue: 2500,
      }),
    ).rejects.toThrow(OpportunityPropertyNotFoundError)
    expect(create).not.toHaveBeenCalled()
    expect(deps.activityRepository.create).not.toHaveBeenCalled()
  })

  it('lança ContactNotFoundError quando o contactId informado é de outro tenant', async () => {
    const create = vi.fn()
    const deps = createDeps({
      findById: vi.fn().mockResolvedValue({ ...contact, tenantId: 'tenant-2' }),
      create,
    })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorPapel: 'ADMIN',
        propertyId: 'imovel-1',
        contactId: 'contato-de-outro-tenant',
        leadName: 'Maria',
        leadEmail: 'maria@exemplo.com',
        proposedValue: 2500,
      }),
    ).rejects.toThrow(ContactNotFoundError)
    expect(create).not.toHaveBeenCalled()
  })

  it('não consulta contato quando contactId não é informado', async () => {
    const findById = vi.fn()
    const deps = createDeps({ findById })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorPapel: 'ADMIN',
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      proposedValue: 2500,
    })

    expect(findById).not.toHaveBeenCalled()
  })

  it('AGENT cria oportunidade no próprio imóvel normalmente', async () => {
    const create = vi.fn().mockResolvedValue(created)
    const deps = createDeps({ create, findResponsavelId: vi.fn().mockResolvedValue('agent-1') })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorPapel: 'AGENT',
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      proposedValue: 2500,
    })

    expect(create).toHaveBeenCalled()
  })

  it('AGENT não pode criar oportunidade em imóvel do qual não é responsável', async () => {
    const create = vi.fn()
    const deps = createDeps({
      create,
      findResponsavelId: vi.fn().mockResolvedValue('outro-agente'),
    })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorPapel: 'AGENT',
        propertyId: 'imovel-1',
        leadName: 'Maria',
        leadEmail: 'maria@exemplo.com',
        proposedValue: 2500,
      }),
    ).rejects.toThrow(ForbiddenError)
    expect(create).not.toHaveBeenCalled()
  })
})
