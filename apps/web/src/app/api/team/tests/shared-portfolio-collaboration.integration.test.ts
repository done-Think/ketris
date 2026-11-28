import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { setupSharePortfolioIntegration } from './fixtures/share-portfolio'
import { POST as transferPortfolio } from '../members/[id]/transfer/route'
import { GET as getLead, PATCH as updateLead } from '../../crm/leads/[id]/route'
import { POST as convertLead } from '../../crm/leads/[id]/convert/route'
import { GET as listLeads } from '../../crm/leads/route'
import { GET as getOpportunity } from '../../crm/opportunities/[id]/route'

describe('Shared portfolio collaboration', () => {
  const integration = setupSharePortfolioIntegration()
  const { user, request, tokens } = integration

  it('shares leads with several brokers, keeps outsiders isolated and revokes only selected access', async () => {
    const { tenantId, sourceId, agentToken, ownerToken } = integration.fixture
    const ana = await user('Ana collaborator')
    const bruno = await user('Bruno collaborator')
    const outsider = await user('Isolated broker')
    const lead = await prisma.lead.findFirstOrThrow({
      where: { tenantId, responsibleId: sourceId, opportunityId: null },
    })
    const items = { properties: false, leads: true, opportunities: false, futureEvents: false }
    expect((await request([ana.id, bruno.id], items)).status).toBe(200)
    const context = { params: Promise.resolve({ id: lead.id }) }
    const read = (token: string) =>
      getLead(
        new NextRequest(`http://localhost/api/crm/leads/${lead.id}`, {
          headers: { authorization: `Bearer ${token}` },
        }),
        context,
      )
    const brunoToken = await tokens.sign(bruno)
    const anaToken = await tokens.sign(ana)
    expect((await read(await tokens.sign(outsider))).status).toBe(404)
    const changed = await updateLead(
      new NextRequest(`http://localhost/api/crm/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${brunoToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'VISIT_SCHEDULED', notes: 'Joint visit' }),
      }),
      context,
    )
    expect(changed.status).toBe(200)
    for (const token of [anaToken, agentToken]) {
      const response = await read(token)
      expect((await response.json()).lead).toMatchObject({
        id: lead.id,
        stage: 'VISIT_SCHEDULED',
        notes: 'Joint visit',
        responsibleId: sourceId,
      })
    }
    const list = await listLeads(
      new NextRequest('http://localhost/api/crm/leads?pageSize=25', {
        headers: { authorization: `Bearer ${anaToken}` },
      }),
    )
    expect((await list.json()).leads).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: lead.id })]),
    )
    const repeated = await request(bruno.id, items)
    expect((await repeated.json()).shared.leads).toBe(0)
    const later = await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: sourceId,
        name: 'Later private lead',
        phone: '11999990005',
        interest: 'House',
        budget: '500000',
        source: 'OTHER',
      },
    })
    expect(await prisma.leadBrokerAccess.count({ where: { leadId: later.id } })).toBe(0)
    expect((await request(bruno.id, items, ownerToken, sourceId, true)).status).toBe(200)
    expect((await read(brunoToken)).status).toBe(404)
    expect((await read(anaToken)).status).toBe(200)
    expect((await read(agentToken)).status).toBe(200)
  })

  it('inherits collaborators when converting a shared lead into a single opportunity', async () => {
    const { tenantId, sourceId, propertyId } = integration.fixture
    const bruno = await user('Conversion collaborator')
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: sourceId,
        propertyId,
        name: 'Shared conversion',
        email: 'conversion@example.test',
        phone: '11999990006',
        interest: 'House',
        budget: '500000',
        source: 'OTHER',
      },
    })
    expect(
      (
        await request(bruno.id, {
          properties: true,
          leads: true,
          opportunities: false,
          futureEvents: false,
        })
      ).status,
    ).toBe(200)
    const token = await tokens.sign(bruno)
    const context = { params: Promise.resolve({ id: lead.id }) }
    const convert = () =>
      convertLead(
        new NextRequest(`http://localhost/api/crm/leads/${lead.id}/convert`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId, proposedValue: 500000 }),
        }),
        context,
      )
    const converted = await convert()
    expect(converted.status).toBe(200)
    const body = await converted.json()
    expect(body.lead).toMatchObject({ id: lead.id, stage: 'PROPOSAL', responsibleId: sourceId })
    expect(
      await prisma.opportunityBrokerAccess.findFirst({
        where: { tenantId, opportunityId: body.opportunityId, userId: bruno.id },
      }),
    ).not.toBeNull()
    const shared = await getOpportunity(
      new NextRequest(`http://localhost/api/crm/opportunities/${body.opportunityId}`, {
        headers: { authorization: `Bearer ${token}` },
      }),
      { params: Promise.resolve({ id: body.opportunityId }) },
    )
    expect(shared.status).toBe(200)
    expect((await convert()).status).toBe(409)
  })

  it('rejects a batch with an invalid recipient without granting any access', async () => {
    const { tenantId, foreignUserId } = integration.fixture
    const destination = await user('Atomic batch recipient')
    expect(
      (
        await request([destination.id, foreignUserId], {
          properties: true,
          leads: true,
          opportunities: true,
          futureEvents: true,
        })
      ).status,
    ).toBe(422)
    expect(
      await prisma.leadBrokerAccess.count({ where: { tenantId, userId: destination.id } }),
    ).toBe(0)
    expect(
      await prisma.propertyBrokerAccess.count({ where: { tenantId, userId: destination.id } }),
    ).toBe(0)
  })
  it('transfers ownership to a replacement, removes the departing broker access and preserves colleagues', async () => {
    const { tenantId, ownerToken, propertyId, sourceId, openOpportunityId } = integration.fixture
    const departing = await user('Departing owner')
    const colleague = await user('Continuing colleague')
    const replacement = await user('Replacement')
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        responsibleId: departing.id,
        propertyId,
        name: 'Transferred lead',
        phone: '11999990007',
        interest: 'House',
        budget: '500000',
        source: 'OTHER',
      },
    })
    expect(
      (
        await request(
          colleague.id,
          { properties: false, leads: true, opportunities: false, futureEvents: false },
          ownerToken,
          departing.id,
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await request(departing.id, {
          properties: true,
          leads: true,
          opportunities: false,
          futureEvents: false,
        })
      ).status,
    ).toBe(200)
    const transferred = await transferPortfolio(
      new NextRequest(`http://localhost/api/team/members/${departing.id}/transfer`, {
        method: 'POST',
        headers: { authorization: `Bearer ${ownerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationId: replacement.id,
          properties: true,
          leads: true,
          opportunities: false,
          futureEvents: false,
        }),
      }),
      { params: Promise.resolve({ id: departing.id }) },
    )
    expect(transferred.status).toBe(200)
    expect(await prisma.lead.findUnique({ where: { id: lead.id } })).toMatchObject({
      responsibleId: replacement.id,
    })
    const read = async (person: typeof departing) =>
      getLead(
        new NextRequest(`http://localhost/api/crm/leads/${lead.id}`, {
          headers: { authorization: `Bearer ${await tokens.sign(person)}` },
        }),
        { params: Promise.resolve({ id: lead.id }) },
      )
    expect((await read(departing)).status).toBe(404)
    expect((await read(replacement)).status).toBe(200)
    expect((await read(colleague)).status).toBe(200)
    expect(await prisma.property.findUnique({ where: { id: propertyId } })).toMatchObject({
      responsibleId: sourceId,
    })
    expect(await prisma.opportunity.findUnique({ where: { id: openOpportunityId } })).toMatchObject(
      { responsibleId: sourceId },
    )
    expect(
      await prisma.opportunityBrokerAccess.count({ where: { tenantId, userId: departing.id } }),
    ).toBe(0)
    const sharedOpportunity = await getOpportunity(
      new NextRequest(`http://localhost/api/crm/opportunities/${openOpportunityId}`, {
        headers: { authorization: `Bearer ${await tokens.sign(replacement)}` },
      }),
      { params: Promise.resolve({ id: openOpportunityId }) },
    )
    expect(sharedOpportunity.status).toBe(200)
  })

  it('rejects grants whose record or recipient belongs to another tenant', async () => {
    const { tenantId, foreignUserId, openOpportunityId } = integration.fixture
    await expect(
      prisma.opportunityBrokerAccess.create({
        data: { tenantId, opportunityId: openOpportunityId, userId: foreignUserId },
      }),
    ).rejects.toMatchObject({ code: 'P2003' })
  })
})
