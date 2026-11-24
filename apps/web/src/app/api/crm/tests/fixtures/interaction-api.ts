import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { beforeAll, afterAll } from 'vitest'
import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { POST as start, GET as leadHistory } from '../../leads/[id]/interactions/route'
import { PATCH as complete } from '../../interactions/[id]/route'
import { GET as contactHistory } from '../../contacts/[id]/interactions/route'
import { GET as opportunityHistory } from '../../opportunities/[id]/interactions/route'

export function setupInteractionApi() {
  const tokens = new JoseTokenService()
  const tenantIds: string[] = []
  let fixture: Awaited<ReturnType<typeof createFixture>>
  async function createFixture() {
    const tenant = await prisma.tenant.create({
      data: { name: 'Interaction tests', slug: `interactions-${randomUUID()}` },
    })
    const foreign = await prisma.tenant.create({
      data: { name: 'Other tenant', slug: `interaction-foreign-${randomUUID()}` },
    })
    tenantIds.push(tenant.id, foreign.id)
    async function actor(role: 'OWNER' | 'AGENT' | 'RENTER', tenantId = tenant.id) {
      const user = await prisma.user.create({
        data: {
          tenantId,
          role,
          name: `${role} interaction tester`,
          email: `${randomUUID()}@interaction.example.test`,
          passwordHash: 'test-hash',
          membershipApprovedAt: new Date(),
        },
      })
      return { user, token: await tokens.sign(user) }
    }
    const owner = await actor('OWNER')
    const agent = await actor('AGENT')
    const colleague = await actor('AGENT')
    const renter = await actor('RENTER')
    const outsider = await actor('OWNER', foreign.id)
    const property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        responsibleId: agent.user.id,
        title: 'Interaction property',
        type: 'HOUSE',
        purpose: 'SALE',
        price: 500000,
        status: 'PUBLISHED',
      },
    })
    return { tenant, foreign, owner, agent, colleague, renter, outsider, property }
  }
  beforeAll(async () => {
    fixture = await createFixture()
  })
  afterAll(async () => {
    const where = { tenantId: { in: tenantIds } }
    await prisma.lead.deleteMany({ where })
    await prisma.opportunityActivity.deleteMany({ where: { opportunity: where } })
    await prisma.opportunity.deleteMany({ where })
    await prisma.property.deleteMany({ where })
    await prisma.contact.deleteMany({ where })
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
    await prisma.$disconnect()
  })
  async function lead(linked = false) {
    const tenantId = fixture.tenant.id
    const contact = linked
      ? await prisma.contact.create({
          data: {
            tenantId,
            createdById: fixture.agent.user.id,
            name: 'Explicitly linked contact',
            email: `${randomUUID()}@contact.example.test`,
          },
        })
      : null
    const opportunity = contact
      ? await prisma.opportunity.create({
          data: {
            tenantId,
            responsibleId: fixture.agent.user.id,
            propertyId: fixture.property.id,
            interestedName: contact.name,
            interestedEmail: contact.email,
            proposedValue: 500000,
            contactId: contact.id,
          },
        })
      : null
    const record = await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: fixture.agent.user.id,
        propertyId: fixture.property.id,
        name: 'Interaction lead',
        phone: '11000000000',
        email: 'interaction-lead@example.invalid',
        interest: 'House',
        budget: '500000',
        source: 'OTHER',
        opportunityId: opportunity?.id,
      },
    })
    return { lead: record, contact, opportunity }
  }
  function request(method: string, body?: object, token: string | null = fixture.agent.token) {
    return new NextRequest('http://localhost/api/crm/interactions', {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
        'X-Ketris-Api-Version': '3',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  }
  const context = (id: string) => ({ params: Promise.resolve({ id }) })
  return {
    get fixture() {
      return fixture
    },
    lead,
    request,
    context,
    start: (id: string, body: object, token?: string | null) =>
      start(request('POST', body, token), context(id)),
    complete: (id: string, body: object, token?: string | null) =>
      complete(request('PATCH', body, token), context(id)),
    history: (
      id: string,
      kind: 'lead' | 'contact' | 'opportunity' = 'lead',
      token?: string | null,
    ) =>
      ({ lead: leadHistory, contact: contactHistory, opportunity: opportunityHistory })[kind](
        request('GET', undefined, token),
        context(id),
      ),
  }
}
