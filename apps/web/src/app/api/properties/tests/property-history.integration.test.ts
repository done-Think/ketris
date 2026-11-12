import { randomUUID } from 'node:crypto'
import { PrismaPropertyRepository } from '@server/properties/infrastructure/prisma-property.repository'
import { PrismaUserRepository } from '@server/auth/infrastructure/prisma-user.repository'
import { PrismaTeamRepository } from '@server/team/infrastructure/prisma-team.repository'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { recordPropertyFieldHistory } from '@server/properties/infrastructure/record-property-history'
import { POST as create } from '../route'
import { PATCH, DELETE } from '../[id]/route'
import { POST as unpublish } from '../[id]/unpublish/route'
import { POST as publish } from '../[id]/publish/route'
import { GET as list } from '../[id]/history/route'
import { GET as detail } from '../[id]/history/[eventId]/route'

describe('property publication permissions and persisted history', () => {
  const tokens = new JoseTokenService()
  const tenants: string[] = []
  let agency: string
  let independent: string
  let manager: Awaited<ReturnType<typeof user>>
  let broker: Awaited<ReturnType<typeof user>>
  let outsider: Awaited<ReturnType<typeof user>>
  let foreign: Awaited<ReturnType<typeof user>>
  let independentBroker: Awaited<ReturnType<typeof user>>

  async function user(tenantId: string, role: 'OWNER' | 'AGENT', name: string) {
    const row = await prisma.user.create({
      data: {
        tenantId,
        name,
        role,
        email: `${randomUUID()}@history.example.test`,
        passwordHash: 'test-only',
        membershipApprovedAt: new Date(),
      },
    })
    return { id: row.id, tenantId, token: await tokens.sign(row) }
  }
  function request(token: string, method = 'GET', body?: unknown) {
    return new NextRequest('http://localhost/api/properties', {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'X-Ketris-Api-Version': '3',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  }
  const context = (id: string) => ({ params: Promise.resolve({ id }) })
  const eventContext = (id: string, eventId: string) => ({
    params: Promise.resolve({ id, eventId }),
  })
  async function property(actor = broker) {
    const response = await create(
      request(actor.token, 'POST', {
        title: 'History house',
        description: 'Test property',
        purpose: 'SALE',
        type: 'HOUSE',
        price: 400000,
        address: {
          street: 'Test street',
          number: '1',
          neighborhood: 'Center',
          city: 'Porto Alegre',
          state: 'RS',
          zipCode: '90000000',
        },
        media: [
          {
            url: `/api/properties/media/properties/${actor.tenantId}/original.jpg`,
            type: 'photo',
            position: 0,
          },
        ],
      }),
    )
    expect(response.status).toBe(201)
    return (await response.json()).property
  }
  async function history(id: string, token = manager.token) {
    const response = await list(request(token), context(id))
    expect(response.status).toBe(200)
    return response.json()
  }
  beforeAll(async () => {
    for (const accountType of ['AGENCY', 'BROKER', 'AGENCY'] as const) {
      const row = await prisma.tenant.create({
        data: { name: 'History test', slug: `history-${randomUUID()}`, accountType },
      })
      tenants.push(row.id)
    }
    ;[agency, independent] = tenants
    manager = await user(agency, 'OWNER', 'Maria Gestora')
    broker = await user(agency, 'AGENT', 'Ana Corretora')
    outsider = await user(agency, 'AGENT', 'Outro corretor')
    foreign = await user(tenants[2], 'OWNER', 'Outro gestor')
    independentBroker = await user(independent, 'AGENT', 'Independente')
  })
  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: tenants } } })
  })

  it('records creation and every saved broker edit, including values, address and cover', async () => {
    const row = await property()
    const update = await PATCH(
      request(broker.token, 'PATCH', {
        title: 'New title',
        price: 420000,
        listing: { ...row.listing, negotiationConditions: ['ACCEPTS_FINANCING'] },
        address: { ...row.address, number: '2' },
        media: [
          {
            url: `/api/properties/media/properties/${agency}/new-cover.jpg`,
            type: 'photo',
            position: 0,
          },
          { url: row.media[0].url, type: 'photo', position: 1 },
        ],
      }),
      context(row.id),
    )
    expect(update.status).toBe(200)
    const page = await history(row.id)
    expect(page.pagination.total).toBe(2)
    expect(page.events[0]).toMatchObject({
      action: 'UPDATED',
      actorName: 'Ana Corretora',
      actorRole: 'AGENT',
    })
    expect(page.events[0]).not.toHaveProperty('changes')
    const event = await detail(request(manager.token), eventContext(row.id, page.events[0].id))
    expect(event.status).toBe(200)
    const data = (await event.json()).event
    expect(data.changes).toContainEqual({ field: 'price', before: 400000, after: 420000 })
    expect(data.changes).toContainEqual({
      field: 'listing.negotiationConditions',
      before: [],
      after: ['ACCEPTS_FINANCING'],
    })
    expect(
      data.changes.find((item: { field: string }) => item.field === 'address').after.number,
    ).toBe('2')
    expect(
      data.changes.find((item: { field: string }) => item.field === 'media').after[0].url,
    ).toContain('new-cover.jpg')
    const original = await prisma.propertyAuditEvent.findFirstOrThrow({
      where: { propertyId: row.id, action: 'CREATED' },
    })
    expect(original.actorName).toBe('Ana Corretora')
    expect(original.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'title', before: null, after: 'History house' }),
      ]),
    )
  })

  it('returns only one editor and its own fields for each selected event', async () => {
    const row = await property()
    expect(
      (await PATCH(request(broker.token, 'PATCH', { price: 430000 }), context(row.id))).status,
    ).toBe(200)
    expect(
      (
        await PATCH(
          request(manager.token, 'PATCH', { description: 'Description from management' }),
          context(row.id),
        )
      ).status,
    ).toBe(200)
    const events = (await history(row.id)).events.filter(
      (event: { action: string }) => event.action === 'UPDATED',
    )
    expect(events).toHaveLength(2)
    for (const summary of events) {
      const response = await detail(request(manager.token), eventContext(row.id, summary.id))
      expect(response.status).toBe(200)
      const event = (await response.json()).event
      expect(event.id).toBe(summary.id)
      expect(event.changes).toEqual(
        summary.actorName === 'Ana Corretora'
          ? [{ field: 'price', before: 400000, after: 430000 }]
          : [
              {
                field: 'description',
                before: 'Test property',
                after: 'Description from management',
              },
            ],
      )
      expect(event.actorName).toBe(summary.actorName)
    }
  })

  it('does not add an event for a no-op and records management edits too', async () => {
    const row = await property()
    expect(
      (await PATCH(request(broker.token, 'PATCH', { title: row.title }), context(row.id))).status,
    ).toBe(200)
    expect((await history(row.id)).pagination.total).toBe(1)
    expect(
      (
        await PATCH(
          request(manager.token, 'PATCH', { description: 'Manager description' }),
          context(row.id),
        )
      ).status,
    ).toBe(200)
    expect((await history(row.id)).events[0]).toMatchObject({
      actorName: 'Maria Gestora',
      action: 'UPDATED',
    })
  })

  it('audits grants, additional broker edits and revocation without granting publication removal', async () => {
    const row = await property()
    const grant = await PATCH(
      request(manager.token, 'PATCH', { brokerIds: [outsider.id] }),
      context(row.id),
    )
    expect(grant.status).toBe(200)
    const page = await history(row.id, outsider.token)
    const grantedEvent = await detail(
      request(outsider.token),
      eventContext(row.id, page.events[0].id),
    )
    expect(grantedEvent.status).toBe(200)
    expect((await grantedEvent.json()).event.changes).toContainEqual({
      field: 'brokers',
      before: [],
      after: [{ id: outsider.id, name: 'Outro corretor' }],
    })
    expect(
      (
        await PATCH(
          request(outsider.token, 'PATCH', { title: 'Edited by assigned broker' }),
          context(row.id),
        )
      ).status,
    ).toBe(200)
    expect((await history(row.id)).events[0].actorName).toBe('Outro corretor')
    expect((await publish(request(manager.token, 'POST'), context(row.id))).status).toBe(200)
    expect((await unpublish(request(outsider.token, 'POST'), context(row.id))).status).toBe(403)
    expect((await DELETE(request(outsider.token, 'DELETE'), context(row.id))).status).toBe(403)
    expect(
      (await PATCH(request(manager.token, 'PATCH', { brokerIds: [] }), context(row.id))).status,
    ).toBe(200)
    expect((await list(request(outsider.token), context(row.id))).status).toBe(404)
    expect(
      (await detail(request(outsider.token), eventContext(row.id, page.events[0].id))).status,
    ).toBe(404)
    await expect(
      new PrismaPropertyRepository().update(
        agency,
        row.id,
        { title: 'Stale permission' },
        outsider.id,
      ),
    ).rejects.toThrow()
    await expect(
      new PrismaPropertyRepository().setStatus(agency, row.id, 'INACTIVE', null, outsider.id),
    ).rejects.toThrow()
    const latest = (await history(row.id)).events[0]
    const revoked = await detail(request(manager.token), eventContext(row.id, latest.id))
    expect((await revoked.json()).event.changes).toContainEqual({
      field: 'brokers',
      before: [{ id: outsider.id, name: 'Outro corretor' }],
      after: [],
    })
  })

  it('audits departure and never restores old grants on reactivation', async () => {
    const departing = await user(agency, 'AGENT', 'Departing broker')
    const row = await property()
    expect(
      (await PATCH(request(manager.token, 'PATCH', { brokerIds: [departing.id] }), context(row.id)))
        .status,
    ).toBe(200)
    await new PrismaUserRepository().deactivate(departing.id, agency, {
      kind: 'USER',
      id: manager.id,
    })
    expect(
      await prisma.propertyBrokerAccess.count({
        where: { propertyId: row.id, userId: departing.id },
      }),
    ).toBe(0)
    const page = await history(row.id)
    const event = await detail(request(manager.token), eventContext(row.id, page.events[0].id))
    expect((await event.json()).event.changes).toContainEqual({
      field: 'brokers',
      before: [{ id: departing.id, name: 'Departing broker' }],
      after: [],
    })
    const reactivated = await prisma.user.update({
      where: { id: departing.id },
      data: { active: true },
    })
    expect((await list(request(await tokens.sign(reactivated)), context(row.id))).status).toBe(404)
  })

  it('audits role-based revocation and keeps grants removed after a role change back', async () => {
    const member = await user(agency, 'AGENT', 'Changed role broker')
    const row = await property()
    expect(
      (await PATCH(request(manager.token, 'PATCH', { brokerIds: [member.id] }), context(row.id)))
        .status,
    ).toBe(200)
    const users = new PrismaUserRepository()
    await users.update(member.id, {
      tenantId: agency,
      role: 'PROPERTY_OWNER',
      auditActor: { kind: 'USER', id: manager.id },
    })
    const page = await history(row.id)
    const event = await detail(request(manager.token), eventContext(row.id, page.events[0].id))
    expect((await event.json()).event.changes).toContainEqual({
      field: 'brokers',
      before: [{ id: member.id, name: 'Changed role broker' }],
      after: [],
    })
    await users.update(member.id, {
      tenantId: agency,
      role: 'AGENT',
      auditActor: { kind: 'USER', id: manager.id },
    })
    const restored = await prisma.user.findUniqueOrThrow({ where: { id: member.id } })
    expect((await list(request(await tokens.sign(restored)), context(row.id))).status).toBe(404)
  })

  it('records only the grants when transferring an additional broker portfolio', async () => {
    const source = await user(agency, 'AGENT', 'Source broker')
    const target = await user(agency, 'AGENT', 'Target broker')
    const row = await property()
    expect(
      (await PATCH(request(manager.token, 'PATCH', { brokerIds: [source.id] }), context(row.id)))
        .status,
    ).toBe(200)
    await new PrismaTeamRepository().transfer({
      tenantId: agency,
      sourceId: source.id,
      destinationId: target.id,
      items: { properties: true, leads: false, opportunities: false, futureEvents: false },
      opportunityScope: 'open',
      reason: 'MANUAL',
      actor: { id: manager.id, name: 'Maria Gestora' },
      now: new Date(),
    })
    const page = await history(row.id, target.token)
    const event = await detail(request(manager.token), eventContext(row.id, page.events[0].id))
    const changes = (await event.json()).event.changes
    expect(changes).toEqual([
      {
        field: 'brokers',
        before: [{ id: source.id, name: 'Source broker' }],
        after: [{ id: target.id, name: 'Target broker' }],
      },
    ])
    expect((await prisma.property.findUniqueOrThrow({ where: { id: row.id } })).responsibleId).toBe(
      broker.id,
    )
    expect((await list(request(source.token), context(row.id))).status).toBe(404)
  })

  it('blocks unpublishing and inactivation for agency brokers while preserving manager authority', async () => {
    const row = await property()
    expect((await publish(request(manager.token, 'POST'), context(row.id))).status).toBe(200)
    const count = (await history(row.id)).pagination.total
    expect((await unpublish(request(broker.token, 'POST'), context(row.id))).status).toBe(403)
    expect((await DELETE(request(broker.token, 'DELETE'), context(row.id))).status).toBe(403)
    expect((await history(row.id)).pagination.total).toBe(count)
    expect((await prisma.property.findUniqueOrThrow({ where: { id: row.id } })).status).toBe(
      'PUBLISHED',
    )
    expect((await unpublish(request(manager.token, 'POST'), context(row.id))).status).toBe(200)
    expect((await history(row.id)).events[0]).toMatchObject({
      action: 'UNPUBLISHED',
      actorName: 'Maria Gestora',
    })
  })

  it('preserves independent broker permissions and isolates history from other tenants and brokers', async () => {
    const row = await property(independentBroker)
    expect((await publish(request(independentBroker.token, 'POST'), context(row.id))).status).toBe(
      200,
    )
    expect(
      (await unpublish(request(independentBroker.token, 'POST'), context(row.id))).status,
    ).toBe(200)
    const owned = await property()
    const eventId = (await history(owned.id)).events[0].id
    for (const actor of [outsider, foreign]) {
      expect((await list(request(actor.token), context(owned.id))).status).toBe(404)
      expect((await detail(request(actor.token), eventContext(owned.id, eventId))).status).toBe(404)
    }
    expect(
      (
        await detail(
          request(manager.token),
          eventContext(owned.id, (await history(row.id, independentBroker.token)).events[0].id),
        )
      ).status,
    ).toBe(404)
  })

  it('serializes concurrent updates so the recorded previous value is the actual committed value', async () => {
    const row = await property()
    const responses = await Promise.all(
      [410000, 420000].map((price) =>
        PATCH(request(broker.token, 'PATCH', { price }), context(row.id)),
      ),
    )
    expect(responses.map((response) => response.status)).toEqual([200, 200])
    const records = await prisma.propertyAuditEvent.findMany({
      where: { propertyId: row.id, action: 'UPDATED' },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })
    const values = records.map((record) =>
      JSON.parse(JSON.stringify(record.changes)).find(
        (change: { field: string }) => change.field === 'price',
      ),
    )
    expect(values[0].before).toBe(400000)
    expect(values[1].before).toBe(values[0].after)
    expect(Number((await prisma.property.findUniqueOrThrow({ where: { id: row.id } })).price)).toBe(
      values[1].after,
    )
  })

  it('rolls back a property mutation when persisting its audit event fails', async () => {
    const row = await property()
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.property.update({ where: { id: row.id }, data: { title: 'Must roll back' } })
        await recordPropertyFieldHistory(tx, {
          tenantId: agency,
          propertyId: 'missing-property',
          actorId: manager.id,
          action: 'UPDATED',
          changes: [{ field: 'title', before: row.title, after: 'Must roll back' }],
        })
      }),
    ).rejects.toThrow()
    expect((await prisma.property.findUniqueOrThrow({ where: { id: row.id } })).title).toBe(
      row.title,
    )
  })

  it('keeps the author name after an account is removed', async () => {
    const row = await property()
    const author = await user(agency, 'OWNER', 'Gestor removido')
    expect(
      (await PATCH(request(author.token, 'PATCH', { title: 'Author snapshot' }), context(row.id)))
        .status,
    ).toBe(200)
    await prisma.user.delete({ where: { id: author.id } })
    const page = await history(row.id)
    expect(page.events[0].actorName).toBe('Gestor removido')
    const saved = await prisma.propertyAuditEvent.findUniqueOrThrow({
      where: { id: page.events[0].id },
    })
    expect(saved.actorUserId).toBeNull()
    expect(saved.actorName).toBe('Gestor removido')
  })
})
