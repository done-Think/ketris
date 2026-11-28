import { describe, expect, it, vi } from 'vitest'
import type { Lead } from '../../../domain/lead.entity'
import type { Contact } from '../../../domain/contact.entity'
import type { CrmInteraction } from '../../../types/interaction'
import type { LeadRepository } from '../../../application/ports/lead-repository.port'
import type { InteractionRepository } from '../../../application/ports/interaction-repository.port'
import { LinkLeadContactUseCase } from '../../../application/use-cases/link-lead-contact.use-case'
import { StartContactInteractionUseCase } from '../../../application/use-cases/start-contact-interaction.use-case'
import { StartLeadInteractionUseCase } from '../../../application/use-cases/start-lead-interaction.use-case'
import { CompleteInteractionUseCase } from '../../../application/use-cases/complete-interaction.use-case'
import { ListInteractionsUseCase } from '../../../application/use-cases/list-interactions.use-case'

const scope = { actorTenantId: 'tenant', actorId: 'agent', actorRole: 'AGENT' as const }
const date = new Date('2026-11-20T12:00:00Z')
const lead: Lead = {
  id: 'lead',
  tenantId: 'tenant',
  responsibleId: 'agent',
  name: 'Customer',
  email: null,
  phone: '11999990000',
  interest: 'House',
  budget: '500000',
  source: 'OTHER',
  stage: 'NEW',
  notes: null,
  opportunityId: null,
  createdAt: date,
  updatedAt: date,
}
const contact: Contact = {
  id: 'contact',
  tenantId: 'tenant',
  createdById: 'agent',
  name: 'Customer',
  email: 'customer@example.invalid',
  phone: lead.phone,
  type: 'RENTER',
  notes: null,
  avatarUrl: null,
  lastInteraction: null,
  archivedAt: null,
  createdAt: date,
  updatedAt: date,
}
const interaction: CrmInteraction = {
  id: 'attempt',
  kind: 'CONTACT_ATTEMPT',
  leadId: 'lead',
  leadName: lead.name,
  opportunityId: null,
  channel: 'PHONE',
  status: 'STARTED',
  description: null,
  actorUserId: 'agent',
  actorName: 'Agent',
  completedById: null,
  createdAt: date,
  completedAt: null,
  canComplete: true,
}
function setup() {
  const leads = {
    findById: vi.fn().mockResolvedValue(lead),
    create: vi.fn(),
    update: vi.fn(),
    findManyByTenant: vi.fn(),
    markConverted: vi.fn(),
    syncContactDetails: vi.fn(),
  } satisfies LeadRepository
  const interactions = {
    findById: vi.fn().mockResolvedValue(interaction),
    findByRequestId: vi.fn().mockResolvedValue(null),
    start: vi.fn().mockResolvedValue(interaction),
    complete: vi.fn().mockResolvedValue(interaction),
    list: vi.fn().mockResolvedValue({
      interactions: [],
      pagination: { page: 1, pageSize: 5, pageCount: 1, totalCount: 0 },
    }),
  } satisfies InteractionRepository
  const getContact = { execute: vi.fn().mockResolvedValue(contact) }
  const createContact = { execute: vi.fn().mockResolvedValue(contact) }
  const links = { link: vi.fn().mockResolvedValue({ ...lead, contactId: contact.id }) }
  return {
    leads,
    interactions,
    getContact,
    createContact,
    links,
    link: new LinkLeadContactUseCase(leads, links, getContact, createContact),
    startContact: new StartContactInteractionUseCase(interactions, getContact),
    startLead: new StartLeadInteractionUseCase(interactions, leads),
    complete: new CompleteInteractionUseCase(interactions),
    list: new ListInteractionsUseCase(interactions, leads, getContact, { execute: vi.fn() }),
  }
}

describe('Explicit lead contact link authorization', () => {
  it('rejects a foreign tenant before creating a contact', async () => {
    const api = setup()
    api.leads.findById.mockResolvedValue({ ...lead, tenantId: 'foreign' })
    await expect(
      api.link.execute({
        ...scope,
        leadId: lead.id,
        contact: { name: contact.name, email: contact.email },
      }),
    ).rejects.toMatchObject({ status: 404 })
    expect(api.createContact.execute).not.toHaveBeenCalled()
    expect(api.links.link).not.toHaveBeenCalled()
  })
  it('rejects another broker before reading or creating contacts', async () => {
    const api = setup()
    api.leads.findById.mockResolvedValue({ ...lead, responsibleId: 'other-agent' })
    await expect(
      api.link.execute({ ...scope, leadId: lead.id, contactId: contact.id }),
    ).rejects.toMatchObject({ status: 404 })
    expect(api.getContact.execute).not.toHaveBeenCalled()
  })
  it('replays the same link without new events and refuses changing an established link', async () => {
    const api = setup()
    api.leads.findById.mockResolvedValue({ ...lead, contactId: contact.id })
    expect(
      await api.link.execute({ ...scope, leadId: lead.id, contactId: contact.id }),
    ).toMatchObject({ contactId: contact.id })
    expect(api.links.link).not.toHaveBeenCalled()
    await expect(
      api.link.execute({ ...scope, leadId: lead.id, contactId: 'other' }),
    ).rejects.toMatchObject({ code: 'LEAD_CONTACT_CONFLICT' })
  })
  it('only links an existing contact after its own authorization check', async () => {
    const api = setup()
    api.getContact.execute.mockRejectedValueOnce(new Error('Contact access rejected'))
    await expect(
      api.link.execute({ ...scope, leadId: lead.id, contactId: contact.id }),
    ).rejects.toThrow('Contact access rejected')
    expect(api.links.link).not.toHaveBeenCalled()
    await api.link.execute({ ...scope, leadId: lead.id, contactId: contact.id })
    expect(api.links.link).toHaveBeenCalledWith(lead.id, contact.id)
    expect(api.createContact.execute).not.toHaveBeenCalled()
  })
  it('refuses archived contacts', async () => {
    const api = setup()
    api.getContact.execute.mockResolvedValue({ ...contact, archivedAt: date })
    await expect(
      api.link.execute({ ...scope, leadId: lead.id, contactId: contact.id }),
    ).rejects.toMatchObject({ status: 404 })
    expect(api.links.link).not.toHaveBeenCalled()
  })
  it('creates a contact only from the explicit validated request and then links it', async () => {
    const api = setup()
    await api.link.execute({
      ...scope,
      leadId: lead.id,
      contact: { name: contact.name, email: contact.email, type: 'OWNER' },
    })
    expect(api.createContact.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: scope.actorId,
        actorTenantId: scope.actorTenantId,
        email: contact.email,
        type: 'OWNER',
      }),
    )
    expect(api.links.link).toHaveBeenCalledWith(lead.id, contact.id)
  })
})

describe('Contact attempts and outcomes', () => {
  it('starts directly on a contact without creating a lead', async () => {
    const api = setup()
    await api.startContact.execute({
      ...scope,
      contactId: contact.id,
      channel: 'PHONE',
      requestId: 'request',
    })
    expect(api.leads.create).not.toHaveBeenCalled()
    expect(api.interactions.complete).not.toHaveBeenCalled()
    expect(api.interactions.start).toHaveBeenCalledWith(
      expect.objectContaining({ contactId: contact.id, channel: 'PHONE' }),
    )
  })
  it('rejects an unavailable phone before persisting an attempt', async () => {
    const api = setup()
    api.getContact.execute.mockResolvedValue({ ...contact, phone: null })
    await expect(
      api.startContact.execute({
        ...scope,
        contactId: contact.id,
        channel: 'WHATSAPP',
        requestId: 'request',
      }),
    ).rejects.toMatchObject({ status: 422 })
    expect(api.interactions.start).not.toHaveBeenCalled()
  })
  it('refuses reusing a lead request identifier for a direct contact attempt', async () => {
    const api = setup()
    api.interactions.findByRequestId.mockResolvedValue(interaction)
    await expect(
      api.startContact.execute({
        ...scope,
        contactId: contact.id,
        channel: 'PHONE',
        requestId: 'request',
      }),
    ).rejects.toMatchObject({ status: 409 })
  })
  it('replays an identical lead request without creating another attempt', async () => {
    const api = setup()
    api.interactions.findByRequestId.mockResolvedValue(interaction)
    expect(
      await api.startLead.execute({
        ...scope,
        leadId: lead.id,
        channel: 'PHONE',
        requestId: 'request',
      }),
    ).toEqual(interaction)
    expect(api.interactions.start).not.toHaveBeenCalled()
  })
  it('requires a usable lead email for the email shortcut', async () => {
    const api = setup()
    await expect(
      api.startLead.execute({ ...scope, leadId: lead.id, channel: 'EMAIL', requestId: 'request' }),
    ).rejects.toMatchObject({ status: 422 })
  })
  it('does not let a colleague complete another authors attempt', async () => {
    const api = setup()
    await expect(
      api.complete.execute({
        ...scope,
        actorId: 'other',
        interactionId: interaction.id,
        status: 'CONTACT_MADE',
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(api.interactions.complete).not.toHaveBeenCalled()
  })
  it('never converts a stage movement into a confirmed conversation', async () => {
    const api = setup()
    api.interactions.findById.mockResolvedValue({
      ...interaction,
      kind: 'STAGE_CHANGED',
      channel: null,
      status: null,
    })
    await expect(
      api.complete.execute({ ...scope, interactionId: interaction.id, status: 'CONTACT_MADE' }),
    ).rejects.toMatchObject({ status: 409 })
  })
  it('replays an identical outcome and rejects replacing a finalized result', async () => {
    const api = setup()
    api.interactions.findById.mockResolvedValue({ ...interaction, status: 'NO_RESPONSE' })
    await api.complete.execute({ ...scope, interactionId: interaction.id, status: 'NO_RESPONSE' })
    expect(api.interactions.complete).not.toHaveBeenCalled()
    await expect(
      api.complete.execute({ ...scope, interactionId: interaction.id, status: 'CONTACT_MADE' }),
    ).rejects.toMatchObject({ status: 409 })
  })
  it('authorizes the history target before querying its records', async () => {
    const api = setup()
    api.getContact.execute.mockRejectedValue(new Error('Contact access rejected'))
    await expect(
      api.list.execute({
        ...scope,
        target: { kind: 'contact', id: contact.id },
        page: 1,
        pageSize: 5,
      }),
    ).rejects.toThrow('Contact access rejected')
    expect(api.interactions.list).not.toHaveBeenCalled()
  })
})
