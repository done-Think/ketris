import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { ContractStatus } from '@prisma/client'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { GET, POST } from '../route'
import { GET as getProperty, PATCH, DELETE } from '../[id]/route'
import { POST as publish } from '../[id]/publish/route'
import { POST as unpublish } from '../[id]/unpublish/route'
import { POST as uploadMedia } from '../media/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

describe('Renter property access (database integration)', () => {
  const tenantIds: string[] = []
  const tokens = new JoseTokenService()
  let renterToken: string
  let agentToken: string
  let ownPropertyIds: string[]
  let hiddenPropertyIds: string[]
  let ownContractIds: string[]
  let unrelatedPropertyId: string

  beforeAll(async () => {
    async function tenant() {
      const row = await prisma.tenant.create({
        data: { name: 'Property access', slug: randomUUID() },
      })
      tenantIds.push(row.id)
      return row.id
    }
    const tenantId = await tenant()
    const foreignTenantId = await tenant()
    async function user(tenantId: string, role: 'RENTER' | 'AGENT') {
      return prisma.user.create({
        data: {
          tenantId,
          role,
          name: role,
          email: `${randomUUID()}@test.invalid`,
          passwordHash: 'test',
        },
      })
    }
    const renter = await user(tenantId, 'RENTER')
    const otherRenter = await user(tenantId, 'RENTER')
    const agent = await user(tenantId, 'AGENT')
    const foreignAgent = await user(foreignTenantId, 'AGENT')
    renterToken = await tokens.sign(renter)
    agentToken = await tokens.sign(agent)

    async function contract(
      tenantId: string,
      agentId: string,
      userId: string | null,
      status: ContractStatus,
      role: 'RENTER' | 'LANDLORD' = 'RENTER',
      propertyId?: string,
    ) {
      const property = propertyId
        ? await prisma.property.findUniqueOrThrow({ where: { id: propertyId } })
        : await prisma.property.create({
            data: {
              tenantId,
              responsibleId: agentId,
              title: 'Linked apartment',
              purpose: 'RENT',
              type: 'APARTMENT',
              price: 1000,
              status: 'DRAFT',
              bedrooms: 2,
              address: {
                create: {
                  street: 'Test Street',
                  number: '10',
                  neighborhood: 'Center',
                  city: 'Test City',
                  state: 'SP',
                  zipCode: '01000000',
                },
              },
              media: {
                create: { url: 'https://example.test/property.png', type: 'PHOTO', position: 0 },
              },
            },
          })
      const opportunity = await prisma.opportunity.create({
        data: {
          tenantId,
          propertyId: property.id,
          responsibleId: await propertyResponsibleId(prisma, property.id),
          interestedName: renter.name,
          interestedEmail: renter.email,
          proposedValue: 1000,
          status: 'ACCEPTED',
        },
      })
      const row = await prisma.contract.create({
        data: {
          tenantId,
          propertyId: property.id,
          sourceOpportunityId: opportunity.id,
          code: randomUUID(),
          amount: 1000,
          dueDay: 5,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2027-01-01'),
          adjustmentIndex: 'IPCA',
          guaranteeType: 'DEPOSIT',
          status,
          parties: {
            create: {
              role,
              userId,
              name: renter.name,
              cpf: '12345678900',
              email: renter.email,
            },
          },
        },
      })
      return { property, contract: row }
    }
    const own = await contract(tenantId, agent.id, renter.id, 'ACTIVE')
    const duplicate = await contract(
      tenantId,
      agent.id,
      renter.id,
      'ACTIVE',
      'RENTER',
      own.property.id,
    )
    const inactiveListing = await contract(tenantId, agent.id, renter.id, 'ACTIVE')
    await prisma.property.update({
      where: { id: inactiveListing.property.id },
      data: { status: 'INACTIVE' },
    })
    ownPropertyIds = [own.property.id, inactiveListing.property.id]
    ownContractIds = [own.contract.id, duplicate.contract.id]
    const unrelated = await contract(tenantId, agent.id, otherRenter.id, 'ACTIVE')
    unrelatedPropertyId = unrelated.property.id
    hiddenPropertyIds = [
      unrelatedPropertyId,
      (await contract(tenantId, agent.id, null, 'ACTIVE')).property.id,
      (await contract(tenantId, agent.id, renter.id, 'ACTIVE', 'LANDLORD')).property.id,
      (await contract(foreignTenantId, foreignAgent.id, renter.id, 'ACTIVE')).property.id,
    ]
    for (const status of ['CLOSED', 'CANCELED', 'DRAFT', 'SIGNED'] as const) {
      hiddenPropertyIds.push((await contract(tenantId, agent.id, renter.id, status)).property.id)
    }
    const noContract = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: agent.id,
        title: 'No contract',
        purpose: 'RENT',
        type: 'HOUSE',
        price: 1000,
      },
    })
    hiddenPropertyIds.push(noContract.id)
  })

  afterAll(async () => {
    const where = { tenantId: { in: tenantIds } }
    await prisma.contract.deleteMany({ where })
    await prisma.opportunity.deleteMany({ where })
    await prisma.property.deleteMany({ where })
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    await prisma.$disconnect()
  })

  function request(path = '', method = 'GET', body?: unknown, token = renterToken) {
    return new NextRequest(`http://localhost/api/properties${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  }
  const context = (id: string) => ({ params: Promise.resolve({ id }) })

  it('lists each linked property once, regardless of listing status, and respects filters', async () => {
    const response = await GET(request())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(
      body.properties.every(
        (property: { activeContractId: string | null }) => property.activeContractId === null,
      ),
    ).toBe(true)
    expect(body.properties.map((property: { id: string }) => property.id).sort()).toEqual(
      [...ownPropertyIds].sort(),
    )
    const sorted = await GET(request('?sortBy=status&locale=en-US'))
    expect(
      (await sorted.json()).properties.map((property: { id: string }) => property.id).sort(),
    ).toEqual([...ownPropertyIds].sort())
    const drafts = await GET(request('?status=DRAFT&purpose=RENT'))
    expect((await drafts.json()).properties.map((property: { id: string }) => property.id)).toEqual(
      [ownPropertyIds[0]],
    )
  })

  it('returns property data and photos only for active, explicit renter links', async () => {
    for (const id of ownPropertyIds) {
      const response = await getProperty(request(`/${id}`), context(id))
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.property.address.street).toBe('Test Street')
      expect(body.property.characteristics.bedrooms).toBe(2)
      expect(body.property.media[0].url).toBe('https://example.test/property.png')
      expect(body.property.activeContractId).toBeNull()
    }
    for (const id of [...hiddenPropertyIds, 'missing']) {
      expect((await getProperty(request(`/${id}`), context(id))).status).toBe(404)
    }
  })

  it('rejects every renter mutation even on an accessible property', async () => {
    const id = ownPropertyIds[0]
    const payload = { title: 'Denied', purpose: 'RENT', type: 'APARTMENT', price: 2000 }
    expect((await POST(request('', 'POST', payload))).status).toBe(403)
    expect((await PATCH(request(`/${id}`, 'PATCH', { title: 'Denied' }), context(id))).status).toBe(
      403,
    )
    expect((await DELETE(request(`/${id}`, 'DELETE'), context(id))).status).toBe(403)
    expect((await publish(request(`/${id}/publish`, 'POST'), context(id))).status).toBe(403)
    expect((await unpublish(request(`/${id}/unpublish`, 'POST'), context(id))).status).toBe(403)
    const formData = new FormData()
    formData.set('file', new File(['image'], 'property.png', { type: 'image/png' }))
    const uploadRequest = new NextRequest('http://localhost/api/properties/media', {
      method: 'POST',
      headers: { authorization: `Bearer ${renterToken}` },
      body: formData,
    })
    expect((await uploadMedia(uploadRequest)).status).toBe(403)
    expect(await prisma.property.findUnique({ where: { id } })).toMatchObject({
      title: 'Linked apartment',
      status: 'DRAFT',
    })
  })

  it('preserves agent access to their assigned properties', async () => {
    const response = await GET(request('', 'GET', undefined, agentToken))
    expect(response.status).toBe(200)
    expect((await response.json()).properties).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: unrelatedPropertyId })]),
    )
  })

  it('removes renter access when all linked contracts cease to be active', async () => {
    await prisma.contract.updateMany({
      where: { id: { in: ownContractIds } },
      data: { status: 'CLOSED' },
    })
    const response = await GET(request())
    expect((await response.json()).properties).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: ownPropertyIds[0] })]),
    )
    expect(
      (await getProperty(request(`/${ownPropertyIds[0]}`), context(ownPropertyIds[0]))).status,
    ).toBe(404)
  })
})
