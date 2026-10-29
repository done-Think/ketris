import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import type { ActivityRepository } from '../../../application/ports/activity-repository.port'
import type { ContactRepository } from '../../../application/ports/contact-repository.port'
import type { OpportunityRepository } from '../../../application/ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../../../application/ports/property-lookup.port'
import type { ResponsibleLookupPort } from '../../../application/ports/responsible-lookup.port'
import { CreateOpportunityUseCase } from '../../../application/use-cases/create-opportunity.use-case'
import type { Contact } from '../../../domain/contact.entity'
import {
  ContactNotFoundError,
  InvalidOpportunityResponsibleError,
  OpportunityPropertyNotFoundError,
} from '../../../domain/errors'
import type { Opportunity } from '../../../domain/opportunity.entity'

const created: Opportunity = {
  id: 'op-1',
  tenantId: 'tenant-1',
  propertyId: 'imovel-1',
  responsibleId: 'user-1',
  responsibleName: 'Gestora',
  contactId: null,
  leadName: 'Maria',
  leadEmail: 'maria@exemplo.com',
  leadPhone: null,
  proposedValue: 2500,
  contractTermMonths: null,
  desiredStartDate: null,
  guaranteeType: 'NONE',
  specialConditions: [],
  notes: null,
  status: 'DRAFT',
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
  type: 'OWNER',
  avatarUrl: null,
  notes: null,
  lastInteraction: null,
  archivedAt: null,
  createdAt: new Date('2026-08-10T00:00:00.000Z'),
  updatedAt: new Date('2026-08-10T00:00:00.000Z'),
}

function createDeps(overrides?: {
  existsForTenant?: PropertyLookupPort['existsForTenant']
  findResponsibleId?: PropertyLookupPort['findResponsibleId']
  findById?: ContactRepository['findById']
  create?: OpportunityRepository['create']
  findActiveStaffName?: ResponsibleLookupPort['findActiveStaffName']
}) {
  const opportunityRepository = {
    create: overrides?.create ?? vi.fn().mockResolvedValue(created),
  } as unknown as OpportunityRepository

  const contactRepository = {
    findById: overrides?.findById ?? vi.fn().mockResolvedValue(contact),
  } as unknown as ContactRepository

  const propertyLookup = {
    existsForTenant: overrides?.existsForTenant ?? vi.fn().mockResolvedValue(true),
    findResponsibleId: overrides?.findResponsibleId ?? vi.fn().mockResolvedValue('agent-1'),
  } as unknown as PropertyLookupPort

  const activityRepository = {
    create: vi.fn().mockResolvedValue({}),
  } as unknown as ActivityRepository

  const responsibleLookup: ResponsibleLookupPort = {
    findActiveStaffName: overrides?.findActiveStaffName ?? vi.fn().mockResolvedValue('Pessoa'),
    listActiveStaff: vi.fn(),
  }

  return {
    opportunityRepository,
    contactRepository,
    propertyLookup,
    activityRepository,
    responsibleLookup,
  }
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
      deps.responsibleLookup,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorRole: 'OWNER',
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
        status: 'DRAFT',
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
      deps.responsibleLookup,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorRole: 'OWNER',
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      proposedValue: 2500,
    })

    expect(deps.activityRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NOTE',
        description: '',
        systemAction: 'OPPORTUNITY_CREATED',
      }),
    )
  })

  it('respeita um status inicial explícito (ENVIADA)', async () => {
    const create = vi.fn().mockResolvedValue({ ...created, status: 'SENT' })
    const deps = createDeps({ create })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
      deps.responsibleLookup,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorRole: 'OWNER',
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      proposedValue: 2500,
      status: 'SENT',
    })

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ status: 'SENT' }))
  })

  it('lança OpportunityPropertyNotFoundError quando o imóvel não pertence ao tenant do ator', async () => {
    const create = vi.fn()
    const deps = createDeps({ existsForTenant: vi.fn().mockResolvedValue(false), create })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
      deps.responsibleLookup,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorRole: 'OWNER',
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
      deps.responsibleLookup,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'user-1',
        actorRole: 'OWNER',
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
      deps.responsibleLookup,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'user-1',
      actorRole: 'OWNER',
      propertyId: 'imovel-1',
      leadName: 'Maria',
      leadEmail: 'maria@exemplo.com',
      proposedValue: 2500,
    })

    expect(findById).not.toHaveBeenCalled()
  })

  it('AGENT cria oportunidade no próprio imóvel normalmente', async () => {
    const create = vi.fn().mockResolvedValue(created)
    const deps = createDeps({ create, findResponsibleId: vi.fn().mockResolvedValue('agent-1') })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
      deps.responsibleLookup,
    )

    await useCase.execute({
      actorTenantId: 'tenant-1',
      actorId: 'agent-1',
      actorRole: 'AGENT',
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
      findResponsibleId: vi.fn().mockResolvedValue('outro-agente'),
    })
    const useCase = new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
      deps.responsibleLookup,
    )

    await expect(
      useCase.execute({
        actorTenantId: 'tenant-1',
        actorId: 'agent-1',
        actorRole: 'AGENT',
        propertyId: 'imovel-1',
        leadName: 'Maria',
        leadEmail: 'maria@exemplo.com',
        proposedValue: 2500,
      }),
    ).rejects.toThrow(ForbiddenError)
    expect(create).not.toHaveBeenCalled()
  })
  function build(deps: ReturnType<typeof createDeps>) {
    return new CreateOpportunityUseCase(
      deps.opportunityRepository,
      deps.contactRepository,
      deps.propertyLookup,
      deps.activityRepository,
      deps.responsibleLookup,
    )
  }

  const base = {
    actorTenantId: 'tenant-1',
    propertyId: 'imovel-1',
    leadName: 'Maria',
    leadEmail: 'maria@exemplo.com',
    proposedValue: 2500,
  }

  it('usa quem criou como responsável quando nenhum é informado', async () => {
    const create = vi.fn().mockResolvedValue(created)
    await build(createDeps({ create })).execute({
      ...base,
      actorId: 'user-1',
      actorRole: 'OWNER',
    })

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ responsibleId: 'user-1' }))
  })

  it('deixa o OWNER escolher outro responsável ativo da equipe', async () => {
    const create = vi.fn().mockResolvedValue(created)
    const findActiveStaffName = vi.fn().mockResolvedValue('Bruno')
    await build(createDeps({ create, findActiveStaffName })).execute({
      ...base,
      actorId: 'user-1',
      actorRole: 'OWNER',
      responsibleId: 'agent-2',
    })

    expect(findActiveStaffName).toHaveBeenCalledWith('tenant-1', 'agent-2')
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ responsibleId: 'agent-2' }))
  })

  it('recusa um responsável que não é da equipe ativa', async () => {
    const create = vi.fn()
    await expect(
      build(createDeps({ create, findActiveStaffName: vi.fn().mockResolvedValue(null) })).execute({
        ...base,
        actorId: 'user-1',
        actorRole: 'OWNER',
        responsibleId: 'inativo',
      }),
    ).rejects.toThrow(InvalidOpportunityResponsibleError)
    expect(create).not.toHaveBeenCalled()
  })

  it('não deixa o AGENT escolher outro responsável', async () => {
    await expect(
      build(createDeps()).execute({
        ...base,
        actorId: 'agent-1',
        actorRole: 'AGENT',
        responsibleId: 'agent-2',
      }),
    ).rejects.toThrow(ForbiddenError)
  })
})
