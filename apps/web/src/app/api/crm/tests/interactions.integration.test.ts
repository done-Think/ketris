import { NextRequest } from 'next/server'
import { GET as listLeadInteractions } from '../leads/[id]/interactions/route'
import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { setupInteractionApi } from './fixtures/interaction-api'
import { PATCH as updateLead } from '../leads/[id]/route'
import { PrismaInteractionRepository } from '@server/crm/infrastructure/prisma-interaction.repository'

const channels = ['PHONE', 'EMAIL', 'WHATSAPP'] as const
const outcomes = ['CONTACT_MADE', 'NO_RESPONSE', 'CANCELLED'] as const

describe('Lead contact interactions', () => {
  const api = setupInteractionApi()
  it.each(channels.flatMap((channel) => outcomes.map((status) => ({ channel, status }))))(
    'records $channel / $status and updates dates only after confirmed contact',
    async ({ channel, status }) => {
      const record = await api.lead(true)
      const response = await api.start(record.lead.id, { channel, requestId: randomUUID() })
      expect(response.status).toBe(200)
      const { interaction } = await response.json()
      expect(interaction).toMatchObject({
        leadId: record.lead.id,
        channel,
        status: 'STARTED',
        actorUserId: api.fixture.agent.user.id,
        canComplete: true,
      })
      expect(await prisma.lead.findUnique({ where: { id: record.lead.id } })).toMatchObject({
        lastContactAt: null,
        stage: 'NEW',
      })
      expect(await prisma.contact.findUnique({ where: { id: record.contact!.id } })).toMatchObject({
        lastInteraction: null,
      })
      const completed = await api.complete(interaction.id, {
        status,
        description: 'Outcome supplied by broker',
      })
      expect(completed.status).toBe(200)
      const final = (await completed.json()).interaction
      expect(final).toMatchObject({
        status,
        canComplete: false,
        description: 'Outcome supplied by broker',
      })
      const lead = await prisma.lead.findUniqueOrThrow({ where: { id: record.lead.id } })
      const contact = await prisma.contact.findUniqueOrThrow({ where: { id: record.contact!.id } })
      expect(Boolean(lead.lastContactAt)).toBe(status === 'CONTACT_MADE')
      expect(Boolean(contact.lastInteraction)).toBe(status === 'CONTACT_MADE')
      for (const [kind, id] of [
        ['lead', record.lead.id],
        ['contact', record.contact!.id],
        ['opportunity', record.opportunity!.id],
      ] as const) {
        const history = await api.history(id, kind)
        expect(history.status).toBe(200)
        expect((await history.json()).interactions).toEqual([
          expect.objectContaining({ id: interaction.id, status }),
        ])
      }
    },
  )

  it('records unconverted leads without creating contacts or opportunities', async () => {
    const record = await api.lead()
    const before = await prisma.contact.count({ where: { tenantId: api.fixture.tenant.id } })
    const response = await api.start(record.lead.id, { channel: 'PHONE', requestId: randomUUID() })
    const interaction = (await response.json()).interaction
    expect((await api.complete(interaction.id, { status: 'CONTACT_MADE' })).status).toBe(200)
    expect(await prisma.lead.findUnique({ where: { id: record.lead.id } })).toMatchObject({
      opportunityId: null,
    })
    expect(await prisma.contact.count({ where: { tenantId: api.fixture.tenant.id } })).toBe(before)
  })

  it('deduplicates retries and refuses request reuse for a different action', async () => {
    const record = await api.lead()
    const body = { channel: 'WHATSAPP', requestId: randomUUID() }
    const [a, b] = await Promise.all([
      api.start(record.lead.id, body),
      api.start(record.lead.id, body),
    ])
    const first = (await a.json()).interaction
    expect((await b.json()).interaction.id).toBe(first.id)
    expect(await prisma.crmInteraction.count({ where: { leadId: record.lead.id } })).toBe(1)
    expect((await api.start(record.lead.id, { ...body, channel: 'EMAIL' })).status).toBe(409)
    expect(
      (await api.complete(first.id, { status: 'NO_RESPONSE', description: 'No answer' })).status,
    ).toBe(200)
    expect(
      (await api.complete(first.id, { status: 'NO_RESPONSE', description: 'No answer' })).status,
    ).toBe(200)
    expect((await api.complete(first.id, { status: 'CONTACT_MADE' })).status).toBe(409)
    expect(
      await prisma.crmAuditEvent.count({
        where: { entityId: record.lead.id, action: 'INTERACTION_COMPLETED' },
      }),
    ).toBe(1)
  })

  it('keeps other brokers, foreign tenants and non-staff roles out of private histories', async () => {
    const record = await api.lead(true)
    const created = await api.start(record.lead.id, { channel: 'EMAIL', requestId: randomUUID() })
    const interaction = (await created.json()).interaction
    for (const token of [api.fixture.colleague.token, api.fixture.outsider.token]) {
      expect((await api.history(record.lead.id, 'lead', token)).status).toBe(404)
      expect((await api.complete(interaction.id, { status: 'CONTACT_MADE' }, token)).status).toBe(
        404,
      )
      expect((await api.history(record.contact!.id, 'contact', token)).status).toBe(404)
      expect(
        (await api.start(record.lead.id, { channel: 'PHONE', requestId: randomUUID() }, token))
          .status,
      ).toBe(404)
    }
    expect((await api.history(record.lead.id, 'lead', null)).status).toBe(401)
    expect((await api.history(record.lead.id, 'lead', api.fixture.renter.token)).status).toBe(403)
    expect((await api.history(record.lead.id, 'lead', api.fixture.owner.token)).status).toBe(200)
  })

  it('does not treat stage or note edits as a new contact', async () => {
    const record = await api.lead()
    const response = await updateLead(
      api.request('PATCH', { stage: 'IN_CONTACT', notes: 'Internal note' }),
      api.context(record.lead.id),
    )
    expect(response.status).toBe(200)
    expect(await prisma.lead.findUnique({ where: { id: record.lead.id } })).toMatchObject({
      lastContactAt: null,
    })
  })

  it('rejects forged metadata, missing destinations and invalid outcomes', async () => {
    const record = await api.lead()
    expect(
      (
        await api.start(record.lead.id, {
          channel: 'PHONE',
          requestId: randomUUID(),
          actorUserId: api.fixture.owner.user.id,
        })
      ).status,
    ).toBe(400)
    await prisma.lead.update({ where: { id: record.lead.id }, data: { email: null } })
    expect(
      (await api.start(record.lead.id, { channel: 'EMAIL', requestId: randomUUID() })).status,
    ).toBe(422)
    const created = await api.start(record.lead.id, { channel: 'PHONE', requestId: randomUUID() })
    const interaction = (await created.json()).interaction
    expect((await api.complete(interaction.id, { status: 'STARTED' })).status).toBe(400)
    expect(
      (
        await api.complete(interaction.id, {
          status: 'CONTACT_MADE',
          description: 'x'.repeat(2001),
        })
      ).status,
    ).toBe(400)
  })

  it('rolls back a confirmed outcome and both dates if auditing fails', async () => {
    const record = await api.lead(true)
    const response = await api.start(record.lead.id, { channel: 'PHONE', requestId: randomUUID() })
    const interaction = (await response.json()).interaction
    const scope = {
      actorTenantId: api.fixture.tenant.id,
      actorId: api.fixture.agent.user.id,
      actorRole: 'AGENT' as const,
    }
    await expect(
      prisma.$transaction(async (tx) => {
        const failing = new Proxy(tx, {
          get(target, field, receiver) {
            if (field === 'crmAuditEvent')
              return new Proxy(target.crmAuditEvent, {
                get(delegate, method, delegateReceiver) {
                  if (method === 'create')
                    return async () => {
                      throw new Error('Forced interaction audit failure')
                    }
                  return Reflect.get(delegate, method, delegateReceiver)
                },
              })
            return Reflect.get(target, field, receiver)
          },
        })
        return new PrismaInteractionRepository(failing, scope).complete({
          ...scope,
          interactionId: interaction.id,
          status: 'CONTACT_MADE',
        })
      }),
    ).rejects.toThrow('Forced interaction audit failure')
    expect(await prisma.crmInteraction.findUnique({ where: { id: interaction.id } })).toMatchObject(
      { status: 'STARTED', completedAt: null },
    )
    expect(await prisma.lead.findUnique({ where: { id: record.lead.id } })).toMatchObject({
      lastContactAt: null,
    })
    expect(await prisma.contact.findUnique({ where: { id: record.contact!.id } })).toMatchObject({
      lastInteraction: null,
    })
  })
  it('paginates without duplicate rows and uses a deterministic order', async () => {
    const record = await api.lead()
    for (let index = 0; index < 12; index++)
      expect(
        (await api.start(record.lead.id, { channel: 'PHONE', requestId: randomUUID() })).status,
      ).toBe(200)
    const page = async (number: number) => {
      const response = await listLeadInteractions(
        new NextRequest(
          `http://localhost/api/crm/leads/${record.lead.id}/interactions?page=${number}&pageSize=5`,
          {
            headers: {
              authorization: `Bearer ${api.fixture.agent.token}`,
              'X-Ketris-Api-Version': '3',
            },
          },
        ),
        api.context(record.lead.id),
      )
      expect(response.status).toBe(200)
      return response.json()
    }
    const first = await page(1)
    const second = await page(2)
    expect(first.pagination).toMatchObject({ totalCount: 12, pageCount: 3, page: 1 })
    expect(first.interactions).toHaveLength(5)
    expect(second.interactions).toHaveLength(5)
    expect(
      new Set([...first.interactions, ...second.interactions].map((interaction) => interaction.id))
        .size,
    ).toBe(10)
    expect((await page(1)).interactions).toEqual(first.interactions)
  })

  it('does not match a lead to a contact just because the email is the same', async () => {
    const record = await api.lead()
    const contact = await prisma.contact.create({
      data: {
        tenantId: api.fixture.tenant.id,
        createdById: api.fixture.agent.user.id,
        name: record.lead.name,
        email: record.lead.email!,
      },
    })
    const created = await api.start(record.lead.id, { channel: 'EMAIL', requestId: randomUUID() })
    expect(
      (await api.complete((await created.json()).interaction.id, { status: 'CONTACT_MADE' }))
        .status,
    ).toBe(200)
    const history = await api.history(contact.id, 'contact')
    expect((await history.json()).interactions).toEqual([])
    expect(await prisma.contact.findUnique({ where: { id: contact.id } })).toMatchObject({
      lastInteraction: null,
    })
  })

  it('prevents two concurrent outcomes from replacing each other', async () => {
    const record = await api.lead()
    const created = await api.start(record.lead.id, { channel: 'PHONE', requestId: randomUUID() })
    const interaction = (await created.json()).interaction
    const responses = await Promise.all([
      api.complete(interaction.id, { status: 'CONTACT_MADE' }),
      api.complete(interaction.id, { status: 'NO_RESPONSE' }),
    ])
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
    expect(
      await prisma.crmAuditEvent.count({
        where: { entityId: record.lead.id, action: 'INTERACTION_COMPLETED' },
      }),
    ).toBe(1)
  })
})
