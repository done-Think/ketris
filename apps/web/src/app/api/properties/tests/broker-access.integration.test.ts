import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { PrismaUserRepository } from '@server/auth/infrastructure/prisma-user.repository'
import { PrismaTeamRepository } from '@server/team/infrastructure/prisma-team.repository'
import { GET, POST } from '../route'
import { GET as getProperty, PATCH } from '../[id]/route'
import { GET as listBrokers } from '../brokers/route'

describe('property broker access through the API', () => {
  const tokens = new JoseTokenService()
  let tenantId: string
  let foreignTenantId: string
  let owner: Awaited<ReturnType<typeof createUser>>
  let first: Awaited<ReturnType<typeof createUser>>
  let second: Awaited<ReturnType<typeof createUser>>
  let foreign: Awaited<ReturnType<typeof createUser>>
  let inactiveId: string
  let pendingId: string

  async function createUser(agencyId: string, role: 'OWNER' | 'AGENT') {
    const user = await prisma.user.create({
      data: {
        tenantId: agencyId,
        name: `${role}-${randomUUID()}`,
        email: `${randomUUID()}@broker-access.example.test`,
        passwordHash: 'test-only',
        role,
      },
    })
    const token = await tokens.sign({ ...user, membershipApprovedAt: user.membershipApprovedAt })
    return { id: user.id, token }
  }

  function request(path: string, token: string, method = 'GET', body?: unknown) {
    return new NextRequest(`http://localhost/api/properties${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  }
  const context = (id: string) => ({ params: Promise.resolve({ id }) })

  async function createProperty(brokerIds = [first.id, second.id]) {
    const response = await POST(
      request('', owner.token, 'POST', {
        title: 'Shared agency house',
        type: 'HOUSE',
        purpose: 'SALE',
        price: 1000,
        brokerIds,
      }),
    )
    expect(response.status).toBe(201)
    return (await response.json()).property.id as string
  }

  beforeAll(async () => {
    tenantId = (
      await prisma.tenant.create({
        data: { name: 'Access agency', slug: `access-${randomUUID()}` },
      })
    ).id
    foreignTenantId = (
      await prisma.tenant.create({ data: { name: 'Other agency', slug: `access-${randomUUID()}` } })
    ).id
    owner = await createUser(tenantId, 'OWNER')
    first = await createUser(tenantId, 'AGENT')
    second = await createUser(tenantId, 'AGENT')
    foreign = await createUser(foreignTenantId, 'AGENT')
    inactiveId = (await createUser(tenantId, 'AGENT')).id
    pendingId = (await createUser(tenantId, 'AGENT')).id
    await prisma.user.update({ where: { id: inactiveId }, data: { active: false } })
    await prisma.user.update({ where: { id: pendingId }, data: { membershipApprovedAt: null } })
  })

  afterAll(async () => {
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantId, foreignTenantId].filter(Boolean) } },
    })
    await prisma.$disconnect()
  })

  it('lists only eligible brokers from the manager agency and rejects invalid grants', async () => {
    const response = await listBrokers(request('/brokers', owner.token))
    expect(response.status).toBe(200)
    expect(
      (await response.json()).brokers.map((broker: { id: string }) => broker.id).sort(),
    ).toEqual([first.id, second.id].sort())
    expect((await listBrokers(request('/brokers', first.token))).status).toBe(403)
    for (const id of [foreign.id, inactiveId, pendingId, owner.id]) {
      expect(
        (
          await POST(
            request('', owner.token, 'POST', {
              title: 'Invalid assignment',
              type: 'HOUSE',
              purpose: 'SALE',
              price: 1000,
              brokerIds: [id],
            }),
          )
        ).status,
      ).toBe(400)
    }
  })

  it('adds the property to both portfolios, supports search and sorting and revokes one grant immediately', async () => {
    const id = await createProperty()
    for (const broker of [first, second]) {
      expect((await getProperty(request(`/${id}`, broker.token), context(id))).status).toBe(200)
      for (const sortBy of ['updatedAt', 'saleValue', 'rentalValue', 'type', 'status']) {
        const response = await GET(request(`?search=Shared&sortBy=${sortBy}`, broker.token))
        expect(response.status).toBe(200)
        expect(
          (await response.json()).properties.some((property: { id: string }) => property.id === id),
        ).toBe(true)
      }
    }
    expect((await getProperty(request(`/${id}`, foreign.token), context(id))).status).toBe(404)
    expect(
      (await PATCH(request(`/${id}`, first.token, 'PATCH', { brokerIds: [] }), context(id))).status,
    ).toBe(403)
    expect(
      (
        await PATCH(
          request(`/${id}`, owner.token, 'PATCH', { brokerIds: [second.id] }),
          context(id),
        )
      ).status,
    ).toBe(200)
    expect((await getProperty(request(`/${id}`, first.token), context(id))).status).toBe(404)
    expect(
      (
        await PATCH(
          request(`/${id}`, first.token, 'PATCH', { title: 'Unauthorized update' }),
          context(id),
        )
      ).status,
    ).toBe(404)
    expect((await getProperty(request(`/${id}`, second.token), context(id))).status).toBe(200)
    expect((await prisma.property.findUniqueOrThrow({ where: { id } })).responsibleId).toBe(
      owner.id,
    )
    await expect(
      prisma.propertyBrokerAccess.create({
        data: { tenantId, propertyId: id, userId: foreign.id },
      }),
    ).rejects.toThrow()
  })

  it('removes grants on deactivation and does not restore them on reactivation', async () => {
    const departing = await createUser(tenantId, 'AGENT')
    const id = await createProperty([departing.id, second.id])
    await new PrismaUserRepository().deactivate(departing.id, tenantId, {
      kind: 'USER',
      id: owner.id,
    })
    expect(await prisma.propertyBrokerAccess.count({ where: { userId: departing.id } })).toBe(0)
    expect([401, 403]).toContain(
      (await getProperty(request(`/${id}`, departing.token), context(id))).status,
    )
    const user = await prisma.user.update({ where: { id: departing.id }, data: { active: true } })
    const token = await tokens.sign(user)
    expect((await getProperty(request(`/${id}`, token), context(id))).status).toBe(404)
    expect((await getProperty(request(`/${id}`, second.token), context(id))).status).toBe(200)
  })

  it('revokes team departures while preserving the property and the other broker grant', async () => {
    const departing = await createUser(tenantId, 'AGENT')
    const id = await createProperty([departing.id, second.id])
    await new PrismaTeamRepository().deactivateWithTransfer({
      tenantId,
      sourceId: departing.id,
      destinationId: owner.id,
      items: { properties: true, leads: true, opportunities: true, futureEvents: true },
      opportunityScope: 'all',
      reason: 'DEACTIVATION',
      actor: { id: owner.id, name: 'Manager' },
      now: new Date(),
    })
    expect(await prisma.propertyBrokerAccess.count({ where: { userId: departing.id } })).toBe(0)
    expect([401, 403]).toContain(
      (await getProperty(request(`/${id}`, departing.token), context(id))).status,
    )
    expect((await getProperty(request(`/${id}`, second.token), context(id))).status).toBe(200)
    expect((await prisma.property.findUniqueOrThrow({ where: { id } })).responsibleId).toBe(
      owner.id,
    )
  })

  it('cascades grants when a secondary broker account is deleted', async () => {
    const departing = await createUser(tenantId, 'AGENT')
    const id = await createProperty([departing.id, second.id])
    await prisma.user.delete({ where: { id: departing.id } })
    expect(await prisma.propertyBrokerAccess.count({ where: { userId: departing.id } })).toBe(0)
    expect((await getProperty(request(`/${id}`, second.token), context(id))).status).toBe(200)
    expect((await prisma.property.findUniqueOrThrow({ where: { id } })).tenantId).toBe(tenantId)
  })
})
