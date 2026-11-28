import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll } from 'vitest'
import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { POST } from '../../members/[id]/share/route'

export function setupSharePortfolioIntegration() {
  const tenantIds: string[] = []
  const tokens = new JoseTokenService()
  let tenantId: string
  let ownerId: string
  let sourceId: string
  let foreignUserId: string
  let ownerToken: string
  let agentToken: string
  let propertyId: string
  let sharedPropertyId: string
  let openOpportunityId: string
  let excludedOpportunityId: string
  let original: unknown
  const now = new Date()

  async function user(name: string, role: 'OWNER' | 'AGENT' = 'AGENT', scope = tenantId) {
    return prisma.user.create({
      data: {
        tenantId: scope,
        name,
        email: `${randomUUID()}@share.example.test`,
        role,
        passwordHash: 'test-hash',
        membershipApprovedAt: now,
      },
    })
  }
  async function snapshot() {
    return Promise.all([
      prisma.property.findMany({
        where: { tenantId },
        select: { id: true, responsibleId: true },
        orderBy: { id: 'asc' },
      }),
      prisma.lead.findMany({
        where: { tenantId, responsibleId: sourceId },
        orderBy: { id: 'asc' },
      }),
      prisma.opportunity.findMany({
        where: { tenantId, responsibleId: sourceId },
        orderBy: { id: 'asc' },
      }),
      prisma.agendaEvent.findMany({
        where: { tenantId, responsibleId: sourceId },
        orderBy: { id: 'asc' },
      }),
    ])
  }
  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Shared portfolio', slug: `share-${randomUUID()}` },
    })
    tenantId = tenant.id
    tenantIds.push(tenantId)
    const owner = await user('Owner', 'OWNER')
    ownerId = owner.id
    ownerToken = await tokens.sign(owner)
    const source = await user('Source')
    sourceId = source.id
    agentToken = await tokens.sign(source)
    const foreignTenant = await prisma.tenant.create({
      data: { name: 'Other tenant', slug: `share-foreign-${randomUUID()}` },
    })
    tenantIds.push(foreignTenant.id)
    foreignUserId = (await user('Foreign', 'AGENT', foreignTenant.id)).id
    async function property(responsibleId: string) {
      return prisma.property.create({
        data: {
          tenantId,
          responsibleId,
          title: 'Portfolio property',
          type: 'HOUSE',
          purpose: 'SALE',
          price: 500000,
          status: 'PUBLISHED',
        },
      })
    }
    propertyId = (await property(sourceId)).id
    sharedPropertyId = (await property(ownerId)).id
    await prisma.propertyBrokerAccess.create({
      data: { tenantId, propertyId: sharedPropertyId, userId: sourceId },
    })
    const contact = await prisma.contact.create({
      data: {
        tenantId,
        name: 'Buyer',
        email: 'buyer@example.test',
        createdById: sourceId,
      },
    })
    for (const status of ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as const) {
      const row = await prisma.opportunity.create({
        data: {
          tenantId,
          propertyId,
          responsibleId: sourceId,
          interestedName: status,
          interestedEmail: 'buyer@example.test',
          proposedValue: 500000,
          notes: 'Source notes',
          specialConditions: ['Condition A'],
          contactId: contact.id,
          status,
        },
      })
      if (status === 'SENT') openOpportunityId = row.id
      if (status === 'REJECTED') excludedOpportunityId = row.id
    }
    const contracted = await prisma.opportunity.create({
      data: {
        tenantId,
        propertyId,
        responsibleId: sourceId,
        interestedName: 'Contracted',
        interestedEmail: 'contracted@example.test',
        proposedValue: 500000,
        status: 'ACCEPTED',
      },
    })
    await prisma.contract.create({
      data: {
        tenantId,
        propertyId,
        sourceOpportunityId: contracted.id,
        code: 'CLONE-EXCLUDED',
        amount: 500000,
        dueDay: 10,
        startDate: now,
        endDate: new Date(now.getTime() + 86_400_000),
        adjustmentIndex: 'IPCA',
        guaranteeType: 'DEPOSIT',
      },
    })
    await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: sourceId,
        propertyId,
        name: 'Converted buyer',
        phone: '11999990000',
        email: 'buyer@example.test',
        interest: 'House',
        budget: '500000',
        source: 'OTHER',
        stage: 'PROPOSAL',
        opportunityId: openOpportunityId,
      },
    })
    await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: sourceId,
        propertyId,
        name: 'Fresh buyer',
        phone: '11999990001',
        interest: 'House',
        budget: '500000',
        source: 'OTHER',
        stage: 'IN_CONTACT',
      },
    })
    for (const status of [
      'CONFIRMED',
      'PENDING',
      'RESCHEDULE',
      'CANCELLED',
      'COMPLETED',
    ] as const) {
      await prisma.agendaEvent.create({
        data: {
          tenantId,
          responsibleId: sourceId,
          ownerUserId: sourceId,
          createdById: ownerId,
          propertyId,
          title: status,
          audience: 'ASSIGNED_AGENT',
          status,
          type: status === 'CONFIRMED' ? 'VISIT' : null,
          start: new Date(now.getTime() + 86_400_000),
          end: new Date(now.getTime() + 90_000_000),
          participantName: 'Buyer',
          participantPhone: '11999990000',
          participants: { create: { userId: ownerId } },
        },
      })
    }
    await prisma.agendaEvent.create({
      data: {
        tenantId,
        responsibleId: sourceId,
        title: 'Past event',
        start: new Date(now.getTime() - 86_400_000),
        end: now,
        participantName: 'Buyer',
        participantPhone: '11999990000',
      },
    })
    original = await snapshot()
  })

  afterAll(async () => {
    const where = { tenantId: { in: tenantIds } }
    await prisma.lead.deleteMany({ where })
    await prisma.contract.deleteMany({ where })
    await prisma.opportunityActivity.deleteMany({ where: { opportunity: where } })
    await prisma.opportunity.deleteMany({ where })
    await prisma.agendaEvent.deleteMany({ where })
    await prisma.property.deleteMany({ where })
    await prisma.contact.deleteMany({ where })
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    await prisma.$disconnect()
  })

  function request(
    destinationId: string | string[],
    items: Record<string, boolean>,
    token = ownerToken,
    source = sourceId,
    revoke = false,
  ) {
    return POST(
      new NextRequest(`http://localhost/api/team/members/${source}/share`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationIds: Array.isArray(destinationId) ? destinationId : [destinationId],
          revoke,
          ...items,
        }),
      }),
      { params: Promise.resolve({ id: source }) },
    )
  }

  return {
    async refreshSnapshot() {
      original = await snapshot()
    },
    user,
    snapshot,
    request,
    tokens,
    now,
    get fixture() {
      return {
        tenantId,
        ownerId,
        sourceId,
        foreignUserId,
        ownerToken,
        agentToken,
        propertyId,
        sharedPropertyId,
        openOpportunityId,
        excludedOpportunityId,
        original,
      }
    },
  }
}
