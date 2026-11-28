import { randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'

import { GET as listContractOpportunities } from '../../../contracts/opportunities/route'
import { GET as getOpportunity, PATCH as patchOpportunity } from '../../opportunities/[id]/route'
import { GET as listOpportunities } from '../../opportunities/route'

describe('Individual owner closing a deal (database integration)', () => {
  const tokens = new JoseTokenService()
  const tenantIds: string[] = []
  let ownerToken: string
  let otherOwnerToken: string
  let opportunityId: string

  async function individualOwner() {
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Individual owner',
        slug: `individual-${randomUUID()}`,
        accountType: 'INDIVIDUAL',
      },
    })
    tenantIds.push(tenant.id)
    const owner = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Owner',
        email: `owner-${randomUUID()}@ketris.dev`,
        passwordHash: 'hash-fake',
        role: 'OWNER',
      },
    })
    return { tenant, owner, token: await tokens.sign(owner) }
  }

  beforeAll(async () => {
    const { tenant, owner, token } = await individualOwner()
    ownerToken = token
    otherOwnerToken = (await individualOwner()).token
    const property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        responsibleId: owner.id,
        ownerId: owner.id,
        title: 'House',
        purpose: 'RENT',
        type: 'HOUSE',
        price: 6400,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId: tenant.id,
        propertyId: property.id,
        responsibleId: owner.id,
        interestedName: 'Interested',
        interestedEmail: `interested-${randomUUID()}@example.test`,
        proposedValue: 6400,
        status: 'SENT',
      },
    })
    opportunityId = opportunity.id
  })

  afterAll(async () => {
    const where = { tenantId: { in: tenantIds } }
    await prisma.opportunityActivity.deleteMany({ where: { opportunity: where } })
    await prisma.opportunity.deleteMany({ where })
    await prisma.property.deleteMany({ where })
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    await prisma.$disconnect()
  })

  function request(path: string, token: string, method = 'GET', body?: unknown) {
    return new NextRequest(`http://localhost/api/${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  }
  const context = (id: string) => ({ params: Promise.resolve({ id }) })

  it('sees the received proposal, accepts it and finds it as the contract source', async () => {
    const list = await listOpportunities(request('crm/opportunities', ownerToken))
    expect(list.status).toBe(200)
    expect(JSON.stringify(await list.json())).toContain(opportunityId)

    const accepted = await patchOpportunity(
      request(`crm/opportunities/${opportunityId}`, ownerToken, 'PATCH', { status: 'ACCEPTED' }),
      context(opportunityId),
    )
    expect(accepted.status).toBe(200)
    expect((await accepted.json()).opportunity.status).toBe('ACCEPTED')

    const sources = await listContractOpportunities(request('contracts/opportunities', ownerToken))
    expect(sources.status).toBe(200)
    expect(JSON.stringify(await sources.json())).toContain(opportunityId)
  })

  it('keeps the proposal away from another individual owner', async () => {
    const response = await getOpportunity(
      request(`crm/opportunities/${opportunityId}`, otherOwnerToken),
      context(opportunityId),
    )
    expect(response.status).toBe(404)
    const sources = await listContractOpportunities(
      request('contracts/opportunities', otherOwnerToken),
    )
    expect(JSON.stringify(await sources.json())).not.toContain(opportunityId)
  })
})
