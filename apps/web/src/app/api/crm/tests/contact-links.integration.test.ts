import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { setupInteractionApi } from './fixtures/interaction-api'
import { POST as linkContact } from '../leads/[id]/contact/route'
import { POST as contactAttempt } from '../contacts/[id]/interactions/route'
import { POST as createLead } from '../leads/route'
import { PATCH as updateLead } from '../leads/[id]/route'
import { PATCH as updateContact } from '../contacts/[id]/route'
import { GET as getContact } from '../contacts/[id]/route'

describe('Explicit CRM contact links', () => {
  const api = setupInteractionApi()
  async function contact() {
    return prisma.contact.create({
      data: {
        tenantId: api.fixture.tenant.id,
        createdById: api.fixture.agent.user.id,
        name: 'Existing customer',
        email: `${randomUUID()}@contact.example.test`,
        phone: '11999990000',
      },
    })
  }
  const link = (leadId: string, body: object, token?: string) =>
    linkContact(api.request('POST', body, token), api.context(leadId))

  it('creates a lead from the selected contact and uses its canonical details', async () => {
    const customer = await contact()
    const response = await createLead(
      api.request('POST', {
        contactId: customer.id,
        name: 'Different input',
        phone: '11000000000',
        email: 'different@example.invalid',
        interest: 'House',
        budget: '500000',
        source: 'OTHER',
      }),
    )
    expect(response.status).toBe(201)
    const { lead } = await response.json()
    expect(lead).toMatchObject({
      contactId: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    })
    const history = await (await api.history(customer.id, 'contact')).json()
    expect(history.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          leadId: lead.id,
          kind: 'LEAD_CREATED',
          canComplete: false,
          channel: null,
          status: null,
        }),
      ]),
    )
    expect(await prisma.contact.count({ where: { id: customer.id } })).toBe(1)
  })

  it('shares earlier conversations after an explicit link without duplicating history or confirming a stage movement', async () => {
    const record = await api.lead()
    const customer = await contact()
    const { interaction } = await (
      await api.start(record.lead.id, { channel: 'PHONE', requestId: randomUUID() })
    ).json()
    expect((await api.complete(interaction.id, { status: 'CONTACT_MADE' })).status).toBe(200)
    expect((await link(record.lead.id, { contactId: customer.id })).status).toBe(200)
    const before = await prisma.contact.findUniqueOrThrow({ where: { id: customer.id } })
    expect(before.lastInteraction).not.toBeNull()
    expect(
      (await updateLead(api.request('PATCH', { stage: 'IN_CONTACT' }), api.context(record.lead.id)))
        .status,
    ).toBe(200)
    const leadHistory = await (await api.history(record.lead.id)).json()
    const contactHistory = await (await api.history(customer.id, 'contact')).json()
    expect(contactHistory.interactions.map((item: { id: string }) => item.id)).toEqual(
      leadHistory.interactions.map((item: { id: string }) => item.id),
    )
    const movement = contactHistory.interactions.find(
      (item: { kind: string }) => item.kind === 'STAGE_CHANGED',
    )
    expect(movement).toMatchObject({
      previousStage: 'NEW',
      nextStage: 'IN_CONTACT',
      status: null,
      canComplete: false,
    })
    expect((await api.complete(movement.id, { status: 'CONTACT_MADE' })).status).toBe(409)
    expect(
      (await prisma.contact.findUniqueOrThrow({ where: { id: customer.id } })).lastInteraction,
    ).toEqual(before.lastInteraction)
    expect(await prisma.crmInteraction.count({ where: { id: interaction.id } })).toBe(1)
    expect((await link(record.lead.id, { contactId: customer.id })).status).toBe(200)
    expect(
      await prisma.crmInteraction.count({
        where: { leadId: record.lead.id, kind: 'CONTACT_LINKED' },
      }),
    ).toBe(1)
  })

  it('creates a contact and links it atomically, rejecting duplicate email and missing fields', async () => {
    const record = await api.lead()
    const email = `${randomUUID()}@created.example.test`
    const payload = {
      contact: { name: record.lead.name, email, phone: record.lead.phone, type: 'RENTER' },
    }
    const responses = await Promise.all([
      link(record.lead.id, payload),
      link(record.lead.id, payload),
    ])
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
    const saved = await prisma.contact.findFirstOrThrow({
      where: { tenantId: api.fixture.tenant.id, email },
    })
    expect((await prisma.lead.findUniqueOrThrow({ where: { id: record.lead.id } })).contactId).toBe(
      saved.id,
    )
    expect(await prisma.contact.count({ where: { tenantId: api.fixture.tenant.id, email } })).toBe(
      1,
    )
    const other = await api.lead()
    expect((await link(other.lead.id, payload)).status).toBe(409)
    expect(
      (await prisma.lead.findUniqueOrThrow({ where: { id: other.lead.id } })).contactId,
    ).toBeNull()
    expect((await link(other.lead.id, { contact: { name: 'No email' } })).status).toBe(400)
    expect(
      (await link(other.lead.id, { contactId: saved.id, contact: payload.contact })).status,
    ).toBe(400)
  })

  it.each(['PHONE', 'EMAIL', 'WHATSAPP'])(
    'records %s directly on a contact without creating a lead',
    async (channel) => {
      const customer = await contact()
      const before = await prisma.lead.count({ where: { tenantId: api.fixture.tenant.id } })
      const requestId = randomUUID()
      const start = () =>
        contactAttempt(api.request('POST', { channel, requestId }), api.context(customer.id))
      const response = await start()
      expect(response.status).toBe(200)
      const { interaction } = await response.json()
      expect(interaction).toMatchObject({
        leadId: null,
        contactId: customer.id,
        channel,
        status: 'STARTED',
      })
      expect((await (await start()).json()).interaction.id).toBe(interaction.id)
      expect(
        (await prisma.contact.findUniqueOrThrow({ where: { id: customer.id } })).lastInteraction,
      ).toBeNull()
      expect(
        (
          await api.complete(interaction.id, {
            status: 'CONTACT_MADE',
            description: 'Confirmed conversation',
          })
        ).status,
      ).toBe(200)
      expect(
        (await prisma.contact.findUniqueOrThrow({ where: { id: customer.id } })).lastInteraction,
      ).not.toBeNull()
      expect(await prisma.lead.count({ where: { tenantId: api.fixture.tenant.id } })).toBe(before)
      expect((await (await api.history(customer.id, 'contact')).json()).interactions[0].id).toBe(
        interaction.id,
      )
    },
  )

  it('makes direct contact attempts visible to its linked lead and preserves independent lead attribution', async () => {
    const record = await api.lead()
    const customer = await contact()
    await link(record.lead.id, { contactId: customer.id })
    const { interaction } = await (
      await contactAttempt(
        api.request('POST', { channel: 'EMAIL', requestId: randomUUID() }),
        api.context(customer.id),
      )
    ).json()
    expect((await api.complete(interaction.id, { status: 'NO_RESPONSE' })).status).toBe(200)
    const history = await (await api.history(record.lead.id)).json()
    expect(history.interactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: interaction.id, leadId: null, status: 'NO_RESPONSE' }),
      ]),
    )
    expect(
      (await prisma.contact.findUniqueOrThrow({ where: { id: customer.id } })).lastInteraction,
    ).toBeNull()
    expect(
      (await prisma.lead.findUniqueOrThrow({ where: { id: record.lead.id } })).lastContactAt,
    ).toBeNull()
  })

  it('enforces tenant and broker access and never links by equal email', async () => {
    const record = await api.lead()
    const customer = await contact()
    expect(
      (await link(record.lead.id, { contactId: customer.id }, api.fixture.colleague.token)).status,
    ).toBe(404)
    expect(
      (await link(record.lead.id, { contactId: customer.id }, api.fixture.outsider.token)).status,
    ).toBe(404)
    expect(
      (
        await contactAttempt(
          api.request(
            'POST',
            { channel: 'PHONE', requestId: randomUUID() },
            api.fixture.colleague.token,
          ),
          api.context(customer.id),
        )
      ).status,
    ).toBe(404)
    const hidden = await prisma.contact.create({
      data: {
        tenantId: api.fixture.tenant.id,
        createdById: api.fixture.colleague.user.id,
        name: 'Hidden',
        email: `${randomUUID()}@hidden.example.test`,
      },
    })
    expect((await link(record.lead.id, { contactId: hidden.id })).status).toBe(404)
    const sameEmail = await prisma.contact.create({
      data: {
        tenantId: api.fixture.tenant.id,
        createdById: api.fixture.agent.user.id,
        name: 'Equal email',
        email: record.lead.email!,
      },
    })
    await updateLead(api.request('PATCH', { stage: 'IN_CONTACT' }), api.context(record.lead.id))
    expect(
      (await prisma.lead.findUniqueOrThrow({ where: { id: record.lead.id } })).contactId,
    ).toBeNull()
    expect((await (await api.history(sameEmail.id, 'contact')).json()).pagination.totalCount).toBe(
      0,
    )
  })

  it('keeps an existing opportunity contact and rejects assigning a different contact', async () => {
    const record = await api.lead(true)
    const other = await contact()
    expect((await link(record.lead.id, { contactId: other.id })).status).toBe(409)
    expect((await link(record.lead.id, { contactId: record.contact!.id })).status).toBe(200)
    expect(
      (await prisma.opportunity.findUniqueOrThrow({ where: { id: record.opportunity!.id } }))
        .contactId,
    ).toBe(record.contact!.id)
  })

  it('grants contact access through an explicitly assigned lead and synchronizes edits to its linked lead', async () => {
    const record = await api.lead()
    const customer = await contact()
    await link(record.lead.id, { contactId: customer.id })
    await prisma.lead.update({
      where: { id: record.lead.id },
      data: { responsibleId: api.fixture.colleague.user.id },
    })
    expect(
      (
        await getContact(
          api.request('GET', undefined, api.fixture.colleague.token),
          api.context(customer.id),
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await updateContact(
          api.request(
            'PATCH',
            { name: 'Updated customer', phone: '11888880000' },
            api.fixture.colleague.token,
          ),
          api.context(customer.id),
        )
      ).status,
    ).toBe(200)
    expect(await prisma.lead.findUniqueOrThrow({ where: { id: record.lead.id } })).toMatchObject({
      name: 'Updated customer',
      phone: '11888880000',
    })
  })
})
