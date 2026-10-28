import { PrismaPropertyRepository } from '@server/properties/infrastructure/prisma-property.repository'
import { PrismaLeadRepository } from '@server/crm/infrastructure/prisma-lead.repository'
import { PrismaBrokerProfileRepository } from '@server/marketplace/infrastructure/prisma-broker-profile.repository'
import { PrismaAgencyProfileRepository } from '@server/marketplace/infrastructure/prisma-agency-profile.repository'
import { recordContractAudit } from '@server/contracts/infrastructure/contract-audit'
import { recordAgendaAudit } from '@server/agenda/infrastructure/agenda-audit'
import { insertCharge, recordChargeAudit } from '@server/financial/infrastructure/charge-writes'
import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { PrismaContactRepository } from '@server/crm/infrastructure/prisma-contact.repository'
import { PrismaOpportunityRepository } from '@server/crm/infrastructure/prisma-opportunity.repository'
import type { CrmScope } from '@server/crm/types/prisma'
import { PrismaMaintenanceTicketRepository } from '@server/maintenance/infrastructure/prisma-maintenance-ticket.repository'
import type {
  MaintenanceActor,
  MaintenanceTicket,
} from '@server/maintenance/types/maintenance-ticket'
import { ConflictError, ForbiddenError } from '@server/shared/errors'

import { prisma } from '../prisma'

describe('incremental human authorship, archive, and soft deletion', () => {
  let tenantId: string
  let foreignTenantId: string
  let ownerId: string
  let secondOwnerId: string
  let foreignOwnerId: string
  let renterId: string
  let propertyId: string
  let contactId: string
  let foreignContactId: string
  let opportunityId: string
  let foreignOpportunityId: string
  let contractId: string
  let ticketId: string
  let scope: CrmScope
  let actor: MaintenanceActor
  const maintenance = new PrismaMaintenanceTicketRepository()

  beforeAll(async () => {
    tenantId = (
      await prisma.tenant.create({
        data: { name: 'Authorship fixture', slug: `authorship-${randomUUID()}` },
      })
    ).id
    foreignTenantId = (
      await prisma.tenant.create({
        data: { name: 'Foreign authorship fixture', slug: `authorship-foreign-${randomUUID()}` },
      })
    ).id
    const newUser = (tenant: string, role: 'OWNER' | 'RENTER') =>
      prisma.user.create({
        data: {
          tenantId: tenant,
          name: 'Authorship user',
          email: `author-${randomUUID()}@example.test`,
          passwordHash: 'unused',
          role,
        },
      })
    ownerId = (await newUser(tenantId, 'OWNER')).id
    secondOwnerId = (await newUser(tenantId, 'OWNER')).id
    foreignOwnerId = (await newUser(foreignTenantId, 'OWNER')).id
    renterId = (await newUser(foreignTenantId, 'RENTER')).id
    const ownProperty = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: ownerId,
        title: 'Authorship property',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1500,
      },
    })
    propertyId = ownProperty.id
    const foreignProperty = await prisma.property.create({
      data: {
        tenantId: foreignTenantId,
        responsibleId: foreignOwnerId,
        title: 'Other authorship property',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1500,
      },
    })
    contactId = (
      await prisma.contact.create({
        data: {
          tenantId,
          name: 'Historical contact',
          email: `contact-${randomUUID()}@example.test`,
        },
      })
    ).id
    foreignContactId = (
      await prisma.contact.create({
        data: {
          tenantId: foreignTenantId,
          name: 'Foreign contact',
          email: `contact-${randomUUID()}@example.test`,
        },
      })
    ).id
    opportunityId = (
      await prisma.opportunity.create({
        data: {
          tenantId,
          propertyId,
          responsibleId: ownerId,
          contactId,
          interestedName: 'Interested person',
          interestedEmail: `lead-${randomUUID()}@example.test`,
          proposedValue: 1400,
          status: 'ACCEPTED',
        },
      })
    ).id
    foreignOpportunityId = (
      await prisma.opportunity.create({
        data: {
          tenantId: foreignTenantId,
          propertyId: foreignProperty.id,
          responsibleId: foreignOwnerId,
          interestedName: 'Foreign interested person',
          interestedEmail: `lead-${randomUUID()}@example.test`,
          proposedValue: 1400,
        },
      })
    ).id
    const contract = await prisma.contract.create({
      data: {
        tenantId,
        propertyId,
        sourceOpportunityId: opportunityId,
        code: `AUTHOR-${randomUUID()}`,
        amount: 1400,
        dueDay: 10,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-01-01'),
        adjustmentIndex: 'IPCA',
        guaranteeType: 'DEPOSIT',
        parties: {
          create: {
            role: 'RENTER',
            name: 'Linked renter',
            cpf: '00000000000',
            email: `renter-${randomUUID()}@example.test`,
            userId: renterId,
          },
        },
      },
    })
    contractId = contract.id
    ticketId = (
      await prisma.maintenanceTicket.create({
        data: {
          tenantId,
          propertyId,
          contractId: contract.id,
          category: 'PLUMBING',
          title: 'Historical ticket',
          description: 'Fixture',
          openedByName: 'Historical author unknown',
        },
      })
    ).id
    scope = { actorTenantId: tenantId, actorId: ownerId, actorRole: 'OWNER' }
    actor = { ...scope, actorId: ownerId, actorName: 'Owner' }
  })

  beforeEach(async () => {
    await prisma.crmAuditEvent.deleteMany({ where: { tenantId } })
    await prisma.contact.updateMany({
      where: { id: { in: [contactId, foreignContactId] } },
      data: {
        name: 'Historical contact',
        createdById: null,
        updatedById: null,
        archivedAt: null,
        archivedById: null,
      },
    })
    await prisma.opportunity.updateMany({
      where: { id: { in: [opportunityId, foreignOpportunityId] } },
      data: {
        notes: null,
        updatedById: null,
        archivedAt: null,
        archivedById: null,
      },
    })
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { responsibleId: ownerId },
    })
    await prisma.maintenanceTicketActivity.deleteMany({ where: { ticketId } })
    await prisma.maintenanceTicketAttachment.deleteMany({ where: { ticketId } })
    await prisma.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        title: 'Historical ticket',
        updatedById: null,
        deletedAt: null,
        deletedById: null,
        status: 'OPEN',
      },
    })
  })

  afterAll(async () => {
    const tenants = [tenantId, foreignTenantId].filter(Boolean)
    if (tenants.length) {
      await prisma.maintenanceTicket.deleteMany({ where: { tenantId: { in: tenants } } })
      await prisma.charge.deleteMany({ where: { tenantId: { in: tenants } } })
      await prisma.contract.deleteMany({ where: { tenantId: { in: tenants } } })
      await prisma.opportunity.deleteMany({ where: { tenantId: { in: tenants } } })
      await prisma.property.deleteMany({ where: { tenantId: { in: tenants } } })
      await prisma.tenant.deleteMany({ where: { id: { in: tenants } } })
    }
    await prisma.$disconnect()
  })

  async function ticket(): Promise<MaintenanceTicket> {
    const row = await maintenance.findById(actor, ticketId)
    if (!row) throw new Error('Missing own fixture ticket')
    return row
  }

  it('does not invent creation authors for historical rows and records the next human change', async () => {
    const before = await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })
    expect(before).toMatchObject({ createdById: null, updatedById: null, archivedById: null })
    await prisma.$transaction(async (tx) => {
      await new PrismaContactRepository(tx, scope).update(contactId, { name: 'Human edit' })
      await new PrismaOpportunityRepository(tx, scope).update(opportunityId, {
        notes: 'Human edit',
      })
    })
    expect(await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).toMatchObject({
      createdById: null,
      updatedById: ownerId,
      archivedAt: null,
      archivedById: null,
    })
    expect(
      await prisma.opportunity.findUniqueOrThrow({ where: { id: opportunityId } }),
    ).toMatchObject({
      updatedById: ownerId,
      archivedAt: null,
      archivedById: null,
    })
  })

  it('takes creation authorship from the authenticated scope and ignores a foreign tenant payload', async () => {
    const created = await prisma.$transaction((tx) =>
      new PrismaContactRepository(tx, scope).create({
        tenantId: foreignTenantId,
        name: 'New contact',
        email: `new-contact-${randomUUID()}@example.test`,
        phone: null,
        type: 'RENTER',
        avatarUrl: null,
        notes: null,
      }),
    )
    expect(await prisma.contact.findUniqueOrThrow({ where: { id: created.id } })).toMatchObject({
      tenantId,
      createdById: ownerId,
      updatedById: ownerId,
    })
    const createdOpportunity = await prisma.$transaction((tx) =>
      new PrismaOpportunityRepository(tx, scope).create({
        tenantId: foreignTenantId,
        propertyId,
        responsibleId: ownerId,
        leadName: 'New lead',
        leadEmail: `new-lead-${randomUUID()}@example.test`,
        leadPhone: null,
        proposedValue: 1400,
        notes: null,
      }),
    )
    expect(
      await prisma.opportunity.findUniqueOrThrow({ where: { id: createdOpportunity.id } }),
    ).toMatchObject({
      tenantId,
      updatedById: ownerId,
    })
  })

  it('records original archive authors without deleting either record or changing opportunity status', async () => {
    await prisma.$transaction(async (tx) => {
      await new PrismaContactRepository(tx, scope).archive(contactId)
      await new PrismaOpportunityRepository(tx, scope).archive(opportunityId)
    })
    const contactBefore = await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })
    const opportunityBefore = await prisma.opportunity.findUniqueOrThrow({
      where: { id: opportunityId },
    })
    expect(contactBefore).toMatchObject({
      updatedById: ownerId,
      archivedById: ownerId,
      archivedAt: expect.any(Date),
    })
    expect(opportunityBefore).toMatchObject({
      updatedById: ownerId,
      archivedById: ownerId,
      archivedAt: expect.any(Date),
      status: 'ACCEPTED',
    })
    const otherScope = { ...scope, actorId: secondOwnerId }
    await prisma.$transaction(async (tx) => {
      await new PrismaContactRepository(tx, otherScope).archive(contactId)
      await new PrismaOpportunityRepository(tx, otherScope).archive(opportunityId)
    })
    expect(await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).toEqual(
      contactBefore,
    )
    expect(await prisma.opportunity.findUniqueOrThrow({ where: { id: opportunityId } })).toEqual(
      opportunityBefore,
    )
    expect(await prisma.crmAuditEvent.count({ where: { tenantId, action: 'ARCHIVED' } })).toBe(2)
  })

  it('keeps an unknown historical archive author null when archive is requested again', async () => {
    const historicalArchive = new Date('2025-01-01')
    await prisma.contact.update({
      where: { id: contactId },
      data: { archivedAt: historicalArchive },
    })
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { archivedAt: historicalArchive },
    })
    await prisma.$transaction(async (tx) => {
      await new PrismaContactRepository(tx, scope).archive(contactId)
      await new PrismaOpportunityRepository(tx, scope).archive(opportunityId)
    })
    expect(await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).toMatchObject({
      archivedAt: historicalArchive,
      archivedById: null,
      updatedById: null,
    })
    expect(
      await prisma.opportunity.findUniqueOrThrow({ where: { id: opportunityId } }),
    ).toMatchObject({ archivedAt: historicalArchive, archivedById: null, updatedById: null })
    expect(await prisma.crmAuditEvent.count({ where: { tenantId, action: 'ARCHIVED' } })).toBe(0)
  })

  it('attributes contact synchronization and reassignment to the writer rather than the responsible user', async () => {
    await prisma.$transaction(async (tx) => {
      const opportunities = new PrismaOpportunityRepository(tx, scope)
      await opportunities.assignResponsible(opportunityId, secondOwnerId)
    })
    expect(
      await prisma.opportunity.findUniqueOrThrow({ where: { id: opportunityId } }),
    ).toMatchObject({ responsibleId: secondOwnerId, updatedById: ownerId })
    await prisma.$transaction(async (tx) => {
      await new PrismaOpportunityRepository(tx, {
        ...scope,
        actorId: secondOwnerId,
      }).syncContactDetails(tenantId, contactId, {
        name: 'Updated contact name',
        email: 'updated-contact@example.test',
        phone: null,
      })
    })
    expect(
      await prisma.opportunity.findUniqueOrThrow({ where: { id: opportunityId } }),
    ).toMatchObject({ updatedById: secondOwnerId, interestedName: 'Updated contact name' })
  })

  it('keeps system changes separate from human authorship', async () => {
    await prisma.$transaction(async (tx) => {
      await new PrismaContactRepository(tx, scope).update(contactId, { name: 'Human edit' })
      await new PrismaContactRepository(tx, { ...scope, actorId: null }).update(contactId, {
        notes: 'System cleanup',
      })
    })
    expect(
      (await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).updatedById,
    ).toBeNull()
    expect(
      await prisma.crmAuditEvent.findFirst({ where: { tenantId, action: 'SYSTEM_UPDATED' } }),
    ).toMatchObject({ actorUserId: null, entityId: contactId })
    await maintenance.addNote(await ticket(), {
      type: 'NOTE',
      message: 'Automated check',
      authorId: null,
      authorName: null,
    })
    expect(
      (await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticketId } })).updatedById,
    ).toBeNull()
    expect(await prisma.maintenanceTicketActivity.findFirst({ where: { ticketId } })).toMatchObject(
      { authorId: null, systemAction: 'SYSTEM_NOTE' },
    )
  })

  it('rejects foreign records and a foreign authenticated actor without changing rows or audit', async () => {
    await expect(
      prisma.$transaction((tx) => new PrismaContactRepository(tx, scope).archive(foreignContactId)),
    ).rejects.toMatchObject({ code: 'P2025' })
    await expect(
      prisma.$transaction((tx) =>
        new PrismaOpportunityRepository(tx, scope).update(foreignOpportunityId, {
          notes: 'Wrong tenant',
        }),
      ),
    ).rejects.toMatchObject({ code: 'P2025' })
    await expect(
      prisma.$transaction((tx) =>
        new PrismaContactRepository(tx, { ...scope, actorId: foreignOwnerId }).update(contactId, {
          name: 'Forged actor',
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(
      await prisma.contact.findUniqueOrThrow({ where: { id: foreignContactId } }),
    ).toMatchObject({ archivedAt: null, archivedById: null, updatedById: null })
    expect((await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).name).toBe(
      'Historical contact',
    )
    expect(
      (await prisma.opportunity.findUniqueOrThrow({ where: { id: foreignOpportunityId } })).notes,
    ).toBeNull()
    expect(await prisma.crmAuditEvent.count({ where: { tenantId } })).toBe(0)
  })

  it('rolls authorship and archive back together with the CRM audit when the transaction fails', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await new PrismaContactRepository(tx, scope).archive(contactId)
        await new PrismaOpportunityRepository(tx, scope).update(opportunityId, {
          notes: 'Aborted change',
        })
        throw new Error('Rollback authorship')
      }),
    ).rejects.toThrow('Rollback authorship')
    expect(await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).toMatchObject({
      updatedById: null,
      archivedById: null,
      archivedAt: null,
    })
    expect(
      await prisma.opportunity.findUniqueOrThrow({ where: { id: opportunityId } }),
    ).toMatchObject({ updatedById: null, notes: null })
    expect(await prisma.crmAuditEvent.count({ where: { tenantId } })).toBe(0)
  })

  it('derives soft-delete authorship from the actor and restores without changing business status', async () => {
    const deleted = await maintenance.mutate(
      await ticket(),
      {
        deletedAt: new Date(),
        deletedById: foreignOwnerId,
      },
      { type: 'DELETION', message: 'Remove ticket', authorId: ownerId, authorName: 'Owner' },
    )
    expect(
      await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticketId } }),
    ).toMatchObject({
      deletedAt: expect.any(Date),
      deletedById: ownerId,
      updatedById: ownerId,
      status: 'OPEN',
    })
    await maintenance.mutate(
      deleted,
      { deletedAt: null, deletedById: null },
      {
        type: 'RESTORATION',
        message: 'Restore ticket',
        authorId: secondOwnerId,
        authorName: 'Second owner',
      },
    )
    expect(
      await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticketId } }),
    ).toMatchObject({
      deletedAt: null,
      deletedById: null,
      updatedById: secondOwnerId,
      status: 'OPEN',
    })
    expect(
      await prisma.maintenanceTicketActivity.count({
        where: { ticketId, type: 'DELETION', authorId: ownerId },
      }),
    ).toBe(1)
    expect(
      await prisma.maintenanceTicketActivity.count({
        where: { ticketId, type: 'RESTORATION', authorId: secondOwnerId },
      }),
    ).toBe(1)
  })

  it('preserves linked cross-tenant renter authorship and refuses an unrelated foreign user', async () => {
    await maintenance.addNote(await ticket(), {
      type: 'NOTE',
      message: 'Renter comment',
      authorId: renterId,
      authorName: 'Linked renter',
    })
    expect(
      (await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticketId } })).updatedById,
    ).toBe(renterId)
    await expect(
      maintenance.addNote(await ticket(), {
        type: 'NOTE',
        message: 'Foreign user comment',
        authorId: foreignOwnerId,
        authorName: 'Foreign owner',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(await prisma.maintenanceTicketActivity.count({ where: { ticketId } })).toBe(1)
    expect(
      (await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticketId } })).updatedById,
    ).toBe(renterId)
  })

  it('records the attachment author on the ticket while preserving the attachment and timeline', async () => {
    const attachment = await maintenance.addAttachment(await ticket(), {
      name: 'Fixture evidence',
      url: 'https://example.test/maintenance-evidence.jpg',
      authorId: ownerId,
      authorName: 'Owner',
    })
    expect(
      (await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticketId } })).updatedById,
    ).toBe(ownerId)
    expect(
      await prisma.maintenanceTicketAttachment.findUnique({ where: { id: attachment.id } }),
    ).not.toBeNull()
    expect(await prisma.maintenanceTicketActivity.findFirst({ where: { ticketId } })).toMatchObject(
      { authorId: ownerId, type: 'ATTACHMENT_ADDED' },
    )
  })

  it('refuses changing the ticket tenant in an internal mutation context', async () => {
    const existing = await ticket()
    await expect(
      maintenance.mutate(
        { ...existing, tenantId: foreignTenantId },
        { title: 'Wrong tenant' },
        {
          type: 'EDIT',
          message: 'Wrong tenant',
          authorId: foreignOwnerId,
          authorName: 'Foreign owner',
        },
      ),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(
      await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticketId } }),
    ).toMatchObject({ tenantId, title: 'Historical ticket', updatedById: null })
    expect(await prisma.maintenanceTicketActivity.count({ where: { ticketId } })).toBe(0)
  })

  it('does not persist authorship or edits if the pending-request decision fails', async () => {
    await expect(
      maintenance.mutate(
        await ticket(),
        { title: 'Must roll back' },
        {
          type: 'CHANGE_DECIDED',
          message: 'Approve missing request',
          authorId: ownerId,
          authorName: 'Owner',
        },
        { kind: 'decision', requestId: randomUUID(), approved: true, actor },
      ),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(
      await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticketId } }),
    ).toMatchObject({ title: 'Historical ticket', updatedById: null })
    expect(await prisma.maintenanceTicketActivity.count({ where: { ticketId } })).toBe(0)
  })
  it('attributes property writes to the authenticated editor and rejects an actor from another tenant', async () => {
    const repository = new PrismaPropertyRepository()
    const created = await repository.create(
      {
        tenantId,
        responsibleId: secondOwnerId,
        title: 'Writer differs from responsible',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1500,
      },
      ownerId,
    )
    expect(
      (await prisma.property.findUniqueOrThrow({ where: { id: created.id } })).updatedById,
    ).toBe(ownerId)
    await repository.update(tenantId, created.id, { title: 'Second editor' }, secondOwnerId)
    expect(
      (await prisma.property.findUniqueOrThrow({ where: { id: created.id } })).updatedById,
    ).toBe(secondOwnerId)
    await expect(
      repository.update(tenantId, created.id, { title: 'Forged edit' }, foreignOwnerId),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect((await prisma.property.findUniqueOrThrow({ where: { id: created.id } })).title).toBe(
      'Second editor',
    )
    await repository.setStatus(tenantId, created.id, 'INACTIVE', null, ownerId)
    expect(
      (await prisma.property.findUniqueOrThrow({ where: { id: created.id } })).updatedById,
    ).toBe(ownerId)
  })

  it('attributes lead edits to their writer and clears human attribution for system writes', async () => {
    const lead = await prisma.$transaction((tx) =>
      new PrismaLeadRepository(tx, scope).create({
        tenantId,
        responsibleId: secondOwnerId,
        name: 'New lead',
        phone: '11999999999',
        email: null,
        interest: 'House',
        budget: '1500',
        source: 'WEBSITE',
        notes: null,
      }),
    )
    expect((await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } })).updatedById).toBe(
      ownerId,
    )
    await prisma.$transaction((tx) =>
      new PrismaLeadRepository(tx, { ...scope, actorId: secondOwnerId }).update(lead.id, {
        notes: 'Human update',
      }),
    )
    expect((await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } })).updatedById).toBe(
      secondOwnerId,
    )
    await prisma.$transaction((tx) =>
      new PrismaLeadRepository(tx, { ...scope, actorId: null }).update(lead.id, {
        notes: 'System update',
      }),
    )
    expect((await prisma.lead.findUniqueOrThrow({ where: { id: lead.id } })).updatedById).toBeNull()
  })

  it('tracks the editors of broker and agency profiles without confusing team members with authors', async () => {
    const brokers = new PrismaBrokerProfileRepository()
    const agencies = new PrismaAgencyProfileRepository()
    await prisma.brokerPublicProfile.upsert({
      where: { userId: ownerId },
      update: {},
      create: { userId: ownerId, displayName: 'Author profile' },
    })
    const broker = await brokers.findByUserId(ownerId)
    if (!broker) throw new Error('Missing fixture broker')
    await brokers.save(ownerId, { ...broker, headline: 'Edited broker' })
    await brokers.setStatus(ownerId, 'DRAFT', null)
    expect(
      (await prisma.brokerPublicProfile.findUniqueOrThrow({ where: { userId: ownerId } }))
        .updatedById,
    ).toBe(ownerId)
    await prisma.agencyPublicProfile.upsert({
      where: { tenantId },
      update: {},
      create: { tenantId, displayName: 'Agency fixture' },
    })
    const agency = await agencies.findByTenantId(tenantId)
    if (!agency) throw new Error('Missing fixture agency')
    await agencies.save(tenantId, { ...agency, headline: 'Edited agency' }, secondOwnerId)
    expect(
      (await prisma.agencyPublicProfile.findUniqueOrThrow({ where: { tenantId } })).updatedById,
    ).toBe(secondOwnerId)
    await expect(agencies.save(tenantId, agency, foreignOwnerId)).rejects.toBeInstanceOf(
      ForbiddenError,
    )
    await agencies.setStatus(tenantId, 'DRAFT', null, ownerId)
    expect(
      (await prisma.agencyPublicProfile.findUniqueOrThrow({ where: { tenantId } })).updatedById,
    ).toBe(ownerId)
  })

  it('keeps contract, agenda and financial mutation metadata atomic with their audit and preserves optimistic timestamps', async () => {
    const event = await prisma.agendaEvent.create({
      data: {
        tenantId,
        responsibleId: ownerId,
        title: 'Authored event',
        participantName: 'Fixture participant',
        participantPhone: '1100000000',
        start: new Date('2027-01-01T10:00:00Z'),
        end: new Date('2027-01-01T11:00:00Z'),
      },
    })
    const contractBefore = await prisma.contract.findUniqueOrThrow({ where: { id: contractId } })
    const charge = await prisma.$transaction(async (tx) => {
      await recordContractAudit(tx, {
        tenantId,
        contractId,
        actorUserId: ownerId,
        action: 'UPDATED',
      })
      await recordAgendaAudit(tx, {
        tenantId,
        eventId: event.id,
        actorUserId: secondOwnerId,
        action: 'UPDATED',
      })
      return insertCharge(tx, {
        tenantId,
        contractId: null,
        description: 'Authored charge',
        type: 'RECEIVABLE',
        amount: 100,
        dueDate: new Date('2027-01-01'),
        status: 'PENDING',
        createdById: ownerId,
      })
    })
    expect(await prisma.contract.findUniqueOrThrow({ where: { id: contractId } })).toMatchObject({
      updatedById: ownerId,
      updatedAt: contractBefore.updatedAt,
    })
    expect(await prisma.agendaEvent.findUniqueOrThrow({ where: { id: event.id } })).toMatchObject({
      updatedById: secondOwnerId,
      updatedAt: event.updatedAt,
    })
    const financial = await prisma.charge.findUniqueOrThrow({ where: { id: charge.id } })
    expect(financial.updatedById).toBe(ownerId)
    await expect(
      prisma.$transaction(async (tx) => {
        await recordContractAudit(tx, {
          tenantId,
          contractId,
          actorUserId: secondOwnerId,
          action: 'UPDATED',
        })
        await recordChargeAudit(tx, {
          tenantId,
          chargeId: charge.id,
          chargeCode: financial.code,
          actorUserId: secondOwnerId,
          action: 'UPDATED',
        })
        throw new Error('Abort audit')
      }),
    ).rejects.toThrow('Abort audit')
    expect(
      (await prisma.contract.findUniqueOrThrow({ where: { id: contractId } })).updatedById,
    ).toBe(ownerId)
    expect((await prisma.charge.findUniqueOrThrow({ where: { id: charge.id } })).updatedById).toBe(
      ownerId,
    )
    await prisma.$transaction((tx) =>
      recordChargeAudit(tx, {
        tenantId,
        chargeId: charge.id,
        chargeCode: financial.code,
        actorUserId: ownerId,
        actorType: 'SYSTEM',
        action: 'UPDATED',
      }),
    )
    expect(await prisma.charge.findUniqueOrThrow({ where: { id: charge.id } })).toMatchObject({
      updatedById: null,
      updatedAt: financial.updatedAt,
    })
    await prisma.agendaEvent.delete({ where: { id: event.id } })
  })
})
