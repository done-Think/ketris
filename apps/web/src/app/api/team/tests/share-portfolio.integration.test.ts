import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { shareBrokerPortfolio } from '@server/team/infrastructure/share-broker-portfolio'
import { setupSharePortfolioIntegration } from './fixtures/share-portfolio'
import { PATCH as updateOpportunity } from '../../crm/opportunities/[id]/route'
import { GET as getAgendaEvent, PATCH as updateAgendaEvent } from '../../agenda/events/[id]/route'
import { GET as listAgendaEvents } from '../../agenda/events/route'
import { POST as cancelAgendaEvent } from '../../agenda/events/[id]/cancel/route'
import { POST as rescheduleAgendaEvent } from '../../agenda/events/[id]/reschedule/route'
import { POST as recordAgendaOutcome } from '../../agenda/events/[id]/outcome/route'

describe('Share broker portfolio', () => {
  const integration = setupSharePortfolioIntegration()
  const { user, snapshot, request, tokens, now } = integration

  it.each(Array.from({ length: 15 }, (_, index) => index + 1))(
    'shares only the selected categories for checkbox combination %i',
    async (mask) => {
      const { tenantId, sourceId, original } = integration.fixture
      const destinationId = (await user(`Recipient ${mask}`)).id
      const items = {
        properties: Boolean(mask & 1),
        leads: Boolean(mask & 2),
        opportunities: Boolean(mask & 4),
        futureEvents: Boolean(mask & 8),
      }
      const response = await request(destinationId, items)
      expect(response.status).toBe(200)
      expect((await response.json()).shared).toEqual({
        properties: items.properties ? 2 : 0,
        leads: items.leads ? 2 : 0,
        opportunities: items.opportunities ? 3 : items.leads ? 1 : 0,
        futureEvents: items.futureEvents ? 3 : 0,
      })
      expect(await prisma.lead.count({ where: { tenantId } })).toBe(2)
      expect(await prisma.opportunity.count({ where: { tenantId } })).toBe(5)
      expect(
        await prisma.leadBrokerAccess.count({ where: { tenantId, userId: destinationId } }),
      ).toBe(items.leads ? 2 : 0)
      expect(
        await prisma.opportunityBrokerAccess.count({ where: { tenantId, userId: destinationId } }),
      ).toBe(items.opportunities ? 3 : items.leads ? 1 : 0)
      expect(await prisma.agendaEvent.count({ where: { tenantId } })).toBe(6)
      expect(
        await prisma.agendaEvent.count({ where: { tenantId, responsibleId: destinationId } }),
      ).toBe(0)
      expect(
        await prisma.userAuditEvent.findFirst({ where: { tenantId, userId: destinationId } }),
      ).toMatchObject({ actorUserId: integration.fixture.ownerId, action: 'UPDATED' })
      expect(await snapshot()).toEqual(original)
      expect(await prisma.lead.count({ where: { tenantId, responsibleId: sourceId } })).toBe(2)
      const revoked = await request(
        destinationId,
        items,
        integration.fixture.ownerToken,
        sourceId,
        true,
      )
      expect(revoked.status).toBe(200)
      expect((await revoked.json()).shared).toEqual({
        properties: items.properties ? 2 : 0,
        leads: items.leads ? 2 : 0,
        opportunities: items.opportunities ? 3 : items.leads ? 1 : 0,
        futureEvents: items.futureEvents ? 3 : 0,
      })
      expect(
        await prisma.leadBrokerAccess.count({ where: { tenantId, userId: destinationId } }),
      ).toBe(0)
      expect(
        await prisma.opportunityBrokerAccess.count({ where: { tenantId, userId: destinationId } }),
      ).toBe(0)
      expect(
        await prisma.propertyBrokerAccess.count({ where: { tenantId, userId: destinationId } }),
      ).toBe(0)
      expect(await prisma.agendaEventParticipant.count({ where: { userId: destinationId } })).toBe(
        0,
      )
      expect(await snapshot()).toEqual(original)
    },
  )

  it('shares the manager portfolio without transferring property responsibility', async () => {
    const { tenantId, ownerId, ownerToken, sharedPropertyId, original } = integration.fixture
    const destinationId = (await user('Agency portfolio recipient')).id
    const response = await request(
      destinationId,
      { properties: true, leads: false, opportunities: false, futureEvents: false },
      ownerToken,
      ownerId,
    )
    expect(response.status).toBe(200)
    expect((await response.json()).shared.properties).toBe(1)
    expect(
      await prisma.propertyBrokerAccess.findMany({ where: { tenantId, userId: destinationId } }),
    ).toMatchObject([{ propertyId: sharedPropertyId }])
    expect(await snapshot()).toEqual(original)
  })

  it('rejects an empty selection and unknown fields before creating records', async () => {
    const { tenantId } = integration.fixture
    const destinationId = (await user('Invalid request recipient')).id
    const empty = { properties: false, leads: false, opportunities: false, futureEvents: false }
    expect((await request(destinationId, empty)).status).toBe(422)
    expect(
      (await request(destinationId, { ...empty, properties: true, unexpected: true })).status,
    ).toBe(400)
    expect(
      await prisma.propertyBrokerAccess.count({ where: { tenantId, userId: destinationId } }),
    ).toBe(0)
  })

  it('edits the same opportunity for both brokers and records the actual author', async () => {
    const { tenantId, openOpportunityId, sourceId } = integration.fixture
    const destination = await user('Shared negotiation recipient')
    expect(
      (
        await request(destination.id, {
          properties: false,
          leads: false,
          opportunities: true,
          futureEvents: false,
        })
      ).status,
    ).toBe(200)
    const response = await updateOpportunity(
      new NextRequest(`http://localhost/api/crm/opportunities/${openOpportunityId}`, {
        method: 'PATCH',
        headers: {
          authorization: `Bearer ${await tokens.sign(destination)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: 'Updated by collaborator' }),
      }),
      { params: Promise.resolve({ id: openOpportunityId }) },
    )
    expect(response.status).toBe(200)
    expect(await prisma.opportunity.findUnique({ where: { id: openOpportunityId } })).toMatchObject(
      { responsibleId: sourceId, notes: 'Updated by collaborator', updatedById: destination.id },
    )
    expect(
      await prisma.crmAuditEvent.findFirst({
        where: { tenantId, entityId: openOpportunityId, actorUserId: destination.id },
      }),
    ).toMatchObject({ action: 'UPDATED' })
    await prisma.opportunity.update({
      where: { id: openOpportunityId },
      data: { notes: 'Source notes', updatedById: null },
    })
    await integration.refreshSnapshot()
  })

  it('shares original future events with read-only access and no duplicate participants', async () => {
    const { tenantId, sourceId, original } = integration.fixture
    const destination = await user('Read-only agenda recipient')
    const token = await tokens.sign(destination)
    const event = await prisma.agendaEvent.findFirstOrThrow({
      where: { tenantId, responsibleId: sourceId, status: 'CONFIRMED' },
    })
    const context = { params: Promise.resolve({ id: event.id }) }
    const read = () =>
      getAgendaEvent(
        new NextRequest(`http://localhost/api/agenda/events/${event.id}`, {
          headers: { authorization: `Bearer ${token}` },
        }),
        context,
      )
    expect((await read()).status).toBe(404)
    const items = { properties: false, leads: false, opportunities: false, futureEvents: true }
    expect((await request(destination.id, items)).status).toBe(200)
    const response = await read()
    expect(response.status).toBe(200)
    expect((await response.json()).event).toMatchObject({
      id: event.id,
      responsibleId: sourceId,
      readOnly: true,
    })
    const updated = await updateAgendaEvent(
      new NextRequest(`http://localhost/api/agenda/events/${event.id}`, {
        method: 'PATCH',
        headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Forbidden edit' }),
      }),
      context,
    )
    expect(updated.status).toBe(403)
    for (const [action, body] of [
      [cancelAgendaEvent, { reason: 'Read-only participant' }],
      [
        rescheduleAgendaEvent,
        {
          start: new Date(now.getTime() + 172_800_000).toISOString(),
          outsideBusinessHoursConfirmed: true,
        },
      ],
      [recordAgendaOutcome, { outcome: 'NO_SHOW' }],
    ] as const) {
      const result = await action(
        new NextRequest(`http://localhost/api/agenda/events/${event.id}`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        context,
      )
      expect(result.status).toBe(403)
    }
    const query = new URLSearchParams({
      from: now.toISOString(),
      to: new Date(now.getTime() + 172_800_000).toISOString(),
    })
    const listed = await listAgendaEvents(
      new NextRequest(`http://localhost/api/agenda/events?${query}`, {
        headers: { authorization: `Bearer ${token}` },
      }),
    )
    expect(listed.status).toBe(200)
    expect((await listed.json()).events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: event.id, responsibleId: sourceId, readOnly: true }),
      ]),
    )
    const repeated = await request(destination.id, items)
    expect((await repeated.json()).shared.futureEvents).toBe(0)
    expect(await prisma.agendaEventParticipant.count({ where: { userId: destination.id } })).toBe(3)
    expect(await snapshot()).toEqual(original)
  })

  it('keeps linked brokers read-only on shared-team events while preserving manager access', async () => {
    const { tenantId, ownerId, ownerToken } = integration.fixture
    const destination = await user('Shared-team participant')
    const token = await tokens.sign(destination)
    const event = await prisma.agendaEvent.create({
      data: {
        tenantId,
        responsibleId: ownerId,
        ownerUserId: ownerId,
        createdById: ownerId,
        title: 'Manager future event',
        audience: 'SHARED_TEAM',
        start: new Date(now.getTime() + 86_400_000),
        end: new Date(now.getTime() + 90_000_000),
        participantName: 'Buyer',
        participantPhone: '11999990000',
      },
    })
    expect(
      (
        await request(
          destination.id,
          { properties: false, leads: false, opportunities: false, futureEvents: true },
          ownerToken,
          ownerId,
        )
      ).status,
    ).toBe(200)
    const context = { params: Promise.resolve({ id: event.id }) }
    const read = await getAgendaEvent(
      new NextRequest(`http://localhost/api/agenda/events/${event.id}`, {
        headers: { authorization: `Bearer ${token}` },
      }),
      context,
    )
    expect((await read.json()).event).toMatchObject({ readOnly: true })
    const update = (actorToken: string) =>
      updateAgendaEvent(
        new NextRequest(`http://localhost/api/agenda/events/${event.id}`, {
          method: 'PATCH',
          headers: { authorization: `Bearer ${actorToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Authorized manager update' }),
        }),
        context,
      )
    expect((await update(token)).status).toBe(403)
    expect((await update(ownerToken)).status).toBe(200)
  })

  it('does not duplicate property access when sharing the same properties again', async () => {
    const { tenantId } = integration.fixture
    const destinationId = (await user('Repeat recipient')).id
    const items = { properties: true, leads: false, opportunities: false, futureEvents: false }
    expect((await request(destinationId, items)).status).toBe(200)
    const second = await request(destinationId, items)
    expect((await second.json()).shared.properties).toBe(0)
    expect(
      await prisma.propertyBrokerAccess.count({ where: { tenantId, userId: destinationId } }),
    ).toBe(2)
  })

  it('rejects foreign, inactive and unapproved recipients, foreign sources and non-managers', async () => {
    const { foreignUserId, sourceId, ownerToken, agentToken } = integration.fixture
    const items = { properties: true, leads: true, opportunities: true, futureEvents: true }
    const destination = await user('Blocked recipient')
    expect((await request(foreignUserId, items)).status).toBe(422)
    expect((await request(sourceId, items)).status).toBe(422)
    expect((await request(destination.id, items, ownerToken, foreignUserId)).status).toBe(404)
    expect((await request(destination.id, items, agentToken)).status).toBe(403)
    await prisma.user.update({ where: { id: destination.id }, data: { active: false } })
    expect((await request(destination.id, items)).status).toBe(422)
    await prisma.user.update({
      where: { id: destination.id },
      data: { active: true, membershipApprovedAt: null },
    })
    expect((await request(destination.id, items)).status).toBe(422)
    expect(await prisma.propertyBrokerAccess.count({ where: { userId: destination.id } })).toBe(0)
  })

  it('rolls back new records if auditing fails', async () => {
    const { tenantId, sourceId, ownerId } = integration.fixture
    const destinationId = (await user('Rollback recipient')).id
    let auditAttempted = false
    await expect(
      prisma.$transaction(async (tx) => {
        const failingTransaction = new Proxy(tx, {
          get(target, field, receiver) {
            if (field === 'userAuditEvent')
              return new Proxy(target.userAuditEvent, {
                get(delegate, method, delegateReceiver) {
                  if (method === 'create')
                    return async () => {
                      auditAttempted = true
                      throw new Error('Forced share audit failure')
                    }
                  return Reflect.get(delegate, method, delegateReceiver)
                },
              })
            return Reflect.get(target, field, receiver)
          },
        })
        return shareBrokerPortfolio(failingTransaction, {
          tenantId,
          sourceId,
          destinationId,
          items: { properties: true, leads: true, opportunities: true, futureEvents: true },
          actor: { id: ownerId, name: 'Owner' },
          now,
        })
      }),
    ).rejects.toThrow('Forced share audit failure')
    expect(auditAttempted).toBe(true)
    expect(
      await prisma.leadBrokerAccess.count({ where: { tenantId, userId: destinationId } }),
    ).toBe(0)
    expect(
      await prisma.opportunityBrokerAccess.count({ where: { tenantId, userId: destinationId } }),
    ).toBe(0)
    expect(
      await prisma.opportunity.count({ where: { tenantId, responsibleId: destinationId } }),
    ).toBe(0)
    expect(
      await prisma.agendaEvent.count({ where: { tenantId, responsibleId: destinationId } }),
    ).toBe(0)
    expect(await prisma.agendaEventParticipant.count({ where: { userId: destinationId } })).toBe(0)
    expect(
      await prisma.propertyBrokerAccess.count({ where: { tenantId, userId: destinationId } }),
    ).toBe(0)
  })
})
