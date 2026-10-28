import { randomUUID } from 'node:crypto'

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

import type { NewOpportunityActivity } from '../../domain/activity.entity'
import { PrismaActivityRepository } from '../../infrastructure/prisma-activity.repository'
import type { CrmScope } from '../../types/prisma'

describe('contact interaction history in CRM activity transactions', () => {
  let tenantId: string
  let foreignTenantId: string
  let authorId: string
  let anotherAuthorId: string
  let contactId: string
  let foreignContactId: string
  let opportunityId: string
  let scope: CrmScope

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Interaction history', slug: `interaction-${randomUUID()}` },
    })
    tenantId = tenant.id
    const foreignTenant = await prisma.tenant.create({
      data: { name: 'Other interaction tenant', slug: `interaction-foreign-${randomUUID()}` },
    })
    foreignTenantId = foreignTenant.id
    const author = await prisma.user.create({
      data: {
        tenantId,
        name: 'Owner',
        email: `interaction-owner-${randomUUID()}@example.test`,
        passwordHash: 'unused',
        role: 'OWNER',
      },
    })
    authorId = author.id
    const anotherAuthor = await prisma.user.create({
      data: {
        tenantId,
        name: 'Another member',
        email: `interaction-member-${randomUUID()}@example.test`,
        passwordHash: 'unused',
        role: 'AGENT',
      },
    })
    anotherAuthorId = anotherAuthor.id
    const contact = await prisma.contact.create({
      data: {
        tenantId,
        name: 'Interested contact',
        email: `interaction-contact-${randomUUID()}@example.test`,
      },
    })
    contactId = contact.id
    const foreignContact = await prisma.contact.create({
      data: {
        tenantId: foreignTenantId,
        name: 'Other tenant contact',
        email: `interaction-foreign-${randomUUID()}@example.test`,
      },
    })
    foreignContactId = foreignContact.id
    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: authorId,
        title: 'Interaction property',
        purpose: 'RENT',
        type: 'APARTMENT',
        price: 1000,
      },
    })
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId: property.id,
        responsibleId: authorId,
        contactId,
        interestedName: 'Interested contact',
        interestedEmail: contact.email,
        proposedValue: 950,
      },
    })
    opportunityId = opportunity.id
    scope = { actorTenantId: tenantId, actorId: authorId, actorRole: 'OWNER' }
  })

  beforeEach(async () => {
    await prisma.opportunityActivity.deleteMany({ where: { opportunityId } })
    await prisma.crmAuditEvent.deleteMany({ where: { tenantId } })
    await prisma.contact.updateMany({
      where: { id: { in: [contactId, foreignContactId] } },
      data: { lastInteraction: null, archivedAt: null, updatedById: null },
    })
    await prisma.opportunity.update({ where: { id: opportunityId }, data: { contactId } })
  })

  afterAll(async () => {
    if (tenantId) {
      await prisma.opportunity.deleteMany({ where: { tenantId } })
      await prisma.property.deleteMany({ where: { tenantId } })
      await prisma.tenant.delete({ where: { id: tenantId } })
    }
    if (foreignTenantId) await prisma.tenant.delete({ where: { id: foreignTenantId } })
    await prisma.$disconnect()
  })

  function activity(changes: Partial<NewOpportunityActivity> = {}): NewOpportunityActivity {
    return {
      opportunityId,
      type: 'CONTACT_MADE',
      description: 'Spoke with the interested contact',
      authorId,
      authorName: 'Owner',
      previousStatus: null,
      newStatus: null,
      ...changes,
    }
  }

  function createActivity(changes: Partial<NewOpportunityActivity> = {}) {
    return prisma.$transaction((tx) =>
      new PrismaActivityRepository(tx, scope).create(activity(changes)),
    )
  }

  it('records the real interaction timestamp and both contact and opportunity audit events', async () => {
    const row = await createActivity()
    expect(await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).toMatchObject({
      lastInteraction: row.createdAt,
      updatedById: authorId,
    })
    const audit = await prisma.crmAuditEvent.findMany({ where: { tenantId } })
    expect(audit).toHaveLength(2)
    expect(audit).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: 'CONTACT',
          entityId: contactId,
          action: 'UPDATED',
          changedFields: ['lastInteraction'],
          actorUserId: authorId,
          actorRole: 'OWNER',
        }),
        expect.objectContaining({
          entityType: 'OPPORTUNITY',
          entityId: opportunityId,
          action: 'ACTIVITY_ADDED',
          changedFields: ['activities'],
          actorUserId: authorId,
        }),
      ]),
    )
  })

  it.each([
    { label: 'notes', changes: { type: 'NOTE' as const } },
    { label: 'status changes', changes: { type: 'STATUS_CHANGE' as const } },
    { label: 'proposal answers', changes: { type: 'PROPOSAL_ANSWERED' as const } },
    { label: 'anonymous system activities', changes: { authorId: null, authorName: null } },
    {
      label: 'system actions attributed to a user',
      changes: { systemAction: 'OPPORTUNITY_RECEIVED' },
    },
  ])('does not treat $label as a contact interaction', async ({ changes }) => {
    await createActivity(changes)
    expect(
      (await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).lastInteraction,
    ).toBeNull()
    expect(await prisma.crmAuditEvent.count({ where: { tenantId, entityType: 'CONTACT' } })).toBe(0)
    expect(
      await prisma.crmAuditEvent.count({ where: { tenantId, entityType: 'OPPORTUNITY' } }),
    ).toBe(1)
  })

  it('requires the activity author to match the authenticated mutation actor', async () => {
    await createActivity({ authorId: anotherAuthorId, authorName: 'Another member' })
    expect(
      (await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).lastInteraction,
    ).toBeNull()
    expect(await prisma.crmAuditEvent.count({ where: { tenantId, entityType: 'CONTACT' } })).toBe(0)
  })

  it('does not move lastInteraction backwards when a newer interaction already exists', async () => {
    const latest = new Date(Date.now() + 86_400_000)
    await prisma.contact.update({ where: { id: contactId }, data: { lastInteraction: latest } })
    const row = await createActivity()
    expect(row.createdAt.getTime()).toBeLessThan(latest.getTime())
    expect(
      (await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).lastInteraction,
    ).toEqual(latest)
    expect(await prisma.crmAuditEvent.count({ where: { tenantId, entityType: 'CONTACT' } })).toBe(0)
  })

  it('updates an older interaction to the later activity timestamp', async () => {
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastInteraction: new Date('2000-01-01') },
    })
    const row = await createActivity()
    expect(
      (await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).lastInteraction,
    ).toEqual(row.createdAt)
  })

  it('does not update archived contacts or a contact linked from another tenant', async () => {
    await prisma.contact.update({ where: { id: contactId }, data: { archivedAt: new Date() } })
    await createActivity()
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { contactId: foreignContactId },
    })
    await createActivity()
    const contacts = await prisma.contact.findMany({
      where: { id: { in: [contactId, foreignContactId] } },
    })
    expect(contacts).toHaveLength(2)
    expect(contacts.every((contact) => contact.lastInteraction === null)).toBe(true)
    expect(await prisma.crmAuditEvent.count({ where: { tenantId, entityType: 'CONTACT' } })).toBe(0)
  })

  it('rolls back the timeline, contact timestamp, and both audits when the mutation aborts', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await new PrismaActivityRepository(tx, scope).create(activity())
        expect(
          (await tx.contact.findUniqueOrThrow({ where: { id: contactId } })).lastInteraction,
        ).not.toBeNull()
        expect(await tx.crmAuditEvent.count({ where: { tenantId } })).toBe(2)
        throw new Error('Abort the whole mutation')
      }),
    ).rejects.toThrow('Abort the whole mutation')
    expect(
      (await prisma.contact.findUniqueOrThrow({ where: { id: contactId } })).lastInteraction,
    ).toBeNull()
    expect(await prisma.opportunityActivity.count({ where: { opportunityId } })).toBe(0)
    expect(await prisma.crmAuditEvent.count({ where: { tenantId } })).toBe(0)
  })
})
