import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { PrismaCrmPropertyCatalog } from '@server/crm/infrastructure/prisma-crm-property-catalog'
import { PrismaPropertyLookupRepository } from '@server/crm/infrastructure/prisma-property-lookup.repository'
import { POST as createLead } from '../../leads/route'
import { GET as getLead } from '../../leads/[id]/route'
import { POST as convertLead } from '../../leads/[id]/convert/route'
import { POST as createOpportunity } from '../../opportunities/route'
import { PATCH as updateOpportunity } from '../../opportunities/[id]/route'
import { GET as listContractOpportunities } from '../../../contracts/opportunities/route'

describe('Shared property negotiation access', () => {
  const tokens = new JoseTokenService()
  const tenantIds: string[] = []
  let tenantId: string
  let managerId: string
  let brokerId: string
  let colleagueId: string
  let outsiderId: string
  let propertyId: string
  let foreignPropertyId: string
  let brokerToken: string
  let colleagueToken: string
  const lookup = new PrismaPropertyLookupRepository(prisma)

  beforeAll(async () => {
    async function tenant() {
      const row = await prisma.tenant.create({
        data: {
          name: 'Shared property test',
          slug: `shared-property-${randomUUID()}`,
        },
      })
      tenantIds.push(row.id)
      return row.id
    }
    tenantId = await tenant()
    async function user(ownerTenantId: string, role: 'OWNER' | 'AGENT') {
      return prisma.user.create({
        data: {
          tenantId: ownerTenantId,
          name: role,
          email: `${randomUUID()}@example.test`,
          passwordHash: 'test-hash',
          role,
          membershipApprovedAt: new Date(),
        },
      })
    }
    const manager = await user(tenantId, 'OWNER')
    managerId = manager.id
    const broker = await user(tenantId, 'AGENT')
    brokerId = broker.id
    brokerToken = await tokens.sign(broker)
    const colleague = await user(tenantId, 'AGENT')
    colleagueId = colleague.id
    colleagueToken = await tokens.sign(colleague)
    outsiderId = (await user(tenantId, 'AGENT')).id
    async function property(ownerTenantId: string, responsibleId: string) {
      return prisma.property.create({
        data: {
          tenantId: ownerTenantId,
          responsibleId,
          title: 'Shared sale apartment',
          type: 'APARTMENT',
          purpose: 'SALE',
          price: 500000,
          status: 'PUBLISHED',
        },
      })
    }
    propertyId = (await property(tenantId, managerId)).id
    await property(tenantId, managerId)
    await prisma.propertyBrokerAccess.createMany({
      data: [brokerId, colleagueId].map((userId) => ({
        tenantId,
        propertyId,
        userId,
      })),
    })
    const otherTenantId = await tenant()
    const foreignManager = await user(otherTenantId, 'OWNER')
    foreignPropertyId = (await property(otherTenantId, foreignManager.id)).id
  })

  afterAll(async () => {
    const where = { tenantId: { in: tenantIds } }
    await prisma.crmAuditEvent.deleteMany({ where })
    await prisma.lead.deleteMany({ where })
    await prisma.opportunityActivity.deleteMany({ where: { opportunity: where } })
    await prisma.opportunity.deleteMany({ where })
    await prisma.property.deleteMany({ where })
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    await prisma.$disconnect()
  })

  function request(path: string, token: string, body?: unknown, method?: string) {
    return new NextRequest(`http://localhost/api/crm/${path}`, {
      method: method ?? (body ? 'POST' : 'GET'),
      headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  }
  const context = (id: string) => ({ params: Promise.resolve({ id }) })
  function catalog(actorId: string) {
    return new PrismaCrmPropertyCatalog(prisma, {
      actorTenantId: tenantId,
      actorId,
      actorRole: 'AGENT',
    })
  }

  it('lists and retrieves granted properties without letting search bypass access', async () => {
    const page = await catalog(brokerId).list({
      q: 'Shared',
      status: 'PUBLISHED',
      page: 1,
      pageSize: 10,
    })
    expect(page.properties.map((property) => property.id)).toEqual([propertyId])
    expect(page.pagination.totalCount).toBe(1)
    expect(await catalog(brokerId).get(propertyId)).toMatchObject({ id: propertyId })
    expect(await catalog(outsiderId).get(propertyId)).toBeNull()
    expect(await lookup.canAccess(tenantId, propertyId, managerId)).toBe(true)
    expect(await lookup.canAccess(tenantId, foreignPropertyId, brokerId)).toBe(false)
  })

  it('creates the broker lead, converts it and keeps colleagues leads private', async () => {
    const response = await createLead(
      request('leads', brokerToken, {
        name: 'Shared property buyer',
        phone: '(11) 99999-0000',
        email: 'buyer@example.test',
        propertyId,
        interest: 'Apartment',
        budget: '500000',
        source: 'OTHER',
      }),
    )
    expect(response.status).toBe(201)
    const { lead } = await response.json()
    expect(lead.responsibleId).toBe(brokerId)
    const privateResponse = await getLead(
      request(`leads/${lead.id}`, colleagueToken),
      context(lead.id),
    )
    expect(privateResponse.status).toBe(404)
    const converted = await convertLead(
      request(`leads/${lead.id}/convert`, brokerToken, {
        propertyId,
        proposedValue: 500000,
      }),
      context(lead.id),
    )
    expect(converted.status).toBe(200)
    const { opportunityId } = await converted.json()
    expect(await prisma.opportunity.findUnique({ where: { id: opportunityId } })).toMatchObject({
      propertyId,
      responsibleId: brokerId,
    })
    for (const status of ['SENT', 'ACCEPTED']) {
      const updated = await updateOpportunity(
        request(`opportunities/${opportunityId}`, brokerToken, { status }, 'PATCH'),
        context(opportunityId),
      )
      expect(updated.status).toBe(200)
    }
    const sources = await listContractOpportunities(
      new NextRequest('http://localhost/api/contracts/opportunities', {
        headers: { authorization: `Bearer ${brokerToken}` },
      }),
    )
    expect(sources.status).toBe(200)
    expect(JSON.stringify(await sources.json())).toContain(opportunityId)
    expect(await prisma.property.findUnique({ where: { id: propertyId } })).toMatchObject({
      responsibleId: managerId,
    })
  })

  it('creates a direct opportunity for a granted broker', async () => {
    const response = await createOpportunity(
      request('opportunities', brokerToken, {
        propertyId,
        leadName: 'Direct buyer',
        leadEmail: 'direct@example.test',
        proposedValue: 500000,
      }),
    )
    expect(response.status).toBe(201)
    expect((await response.json()).opportunity).toMatchObject({
      propertyId,
      responsibleId: brokerId,
    })
  })

  it('rejects a foreign property even when its ID is submitted directly', async () => {
    const response = await createOpportunity(
      request('opportunities', brokerToken, {
        propertyId: foreignPropertyId,
        leadName: 'Foreign buyer',
        leadEmail: 'foreign@example.test',
        proposedValue: 500000,
      }),
    )
    expect(response.status).toBe(404)
  })

  it.each(['revoked', 'inactive', 'unapproved'] as const)(
    'rejects %s access on a fresh lookup',
    async (state) => {
      if (state === 'revoked') {
        await prisma.propertyBrokerAccess.deleteMany({
          where: { tenantId, propertyId, userId: brokerId },
        })
      } else {
        await prisma.user.update({
          where: { id: brokerId },
          data: state === 'inactive' ? { active: false } : { membershipApprovedAt: null },
        })
      }
      try {
        expect(await lookup.canAccess(tenantId, propertyId, brokerId)).toBe(false)
        expect(await lookup.findAvailable(tenantId, propertyId, brokerId)).toBeNull()
        expect(await catalog(brokerId).get(propertyId)).toBeNull()
      } finally {
        await prisma.user.update({
          where: { id: brokerId },
          data: { active: true, membershipApprovedAt: new Date() },
        })
        await prisma.propertyBrokerAccess.upsert({
          where: { propertyId_userId: { propertyId, userId: brokerId } },
          create: { tenantId, propertyId, userId: brokerId },
          update: {},
        })
      }
    },
  )
})
