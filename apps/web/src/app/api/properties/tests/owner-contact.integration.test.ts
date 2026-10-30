import { randomUUID } from 'node:crypto'
import type { Contact, User } from '@prisma/client'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { GET as listContacts } from '../../crm/contacts/route'
import { GET as listProperties, POST } from '../route'
import { GET, PATCH } from '../[id]/route'

describe('property owner contacts and independent access', () => {
  const tokens = new JoseTokenService()
  const tenants: string[] = []
  let staff: User
  let agent: User
  let otherAgent: User
  let account: User
  let unlinkedAccount: User
  let contact: Contact
  let hiddenContact: Contact
  let foreignContact: Contact
  let archivedContact: Contact

  async function request(actor: User, method: string, body?: unknown, path = 'properties') {
    return new NextRequest(`http://localhost:3000/api/${path}`, {
      method,
      headers: {
        authorization: `Bearer ${await tokens.sign(actor)}`,
        'content-type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }
  function context(id: string) {
    return { params: Promise.resolve({ id }) }
  }
  function payload(ownerContactId: string | null, ownerId?: string) {
    return {
      title: 'Property with CRM owner',
      type: 'HOUSE',
      purpose: 'RENT',
      price: 2000,
      ownerContactId,
      ownerId,
    }
  }

  beforeAll(async () => {
    for (let i = 0; i < 2; i++) {
      const tenant = await prisma.tenant.create({
        data: { name: 'Contact ownership test', slug: `owner-contact-${randomUUID()}` },
      })
      tenants.push(tenant.id)
    }
    async function user(role: User['role']) {
      return prisma.user.create({
        data: {
          tenantId: tenants[0],
          name: role,
          email: `${randomUUID()}@example.test`,
          passwordHash: 'test-only',
          role,
        },
      })
    }
    staff = await user('OWNER')
    agent = await user('AGENT')
    otherAgent = await user('AGENT')
    account = await user('PROPERTY_OWNER')
    unlinkedAccount = await user('PROPERTY_OWNER')
    async function crmContact(
      name: string,
      tenantId: string,
      createdById: string,
      archived = false,
      email = `${randomUUID()}@example.test`,
    ) {
      return prisma.contact.create({
        data: {
          name,
          tenantId,
          createdById,
          email,
          type: 'OWNER',
          archivedAt: archived ? new Date() : null,
        },
      })
    }
    // Even a matching email must not grant access through the contact link.
    contact = await crmContact(
      'Visible CRM owner',
      tenants[0],
      agent.id,
      false,
      unlinkedAccount.email,
    )
    hiddenContact = await crmContact('Other agent contact', tenants[0], otherAgent.id)
    const foreignCreator = await prisma.user.create({
      data: {
        tenantId: tenants[1],
        name: 'Foreign creator',
        email: `${randomUUID()}@example.test`,
        passwordHash: 'test-only',
        role: 'OWNER',
      },
    })
    foreignContact = await crmContact('Other tenant contact', tenants[1], foreignCreator.id)
    archivedContact = await crmContact('Archived contact', tenants[0], agent.id, true)
  })

  afterAll(async () => {
    // Also exercises cascading tenant removal with the composite contact reference.
    await prisma.tenant.deleteMany({ where: { id: { in: tenants } } })
  })

  it('links a contact without creating or granting a login, preserving the separate account', async () => {
    const before = await prisma.user.count({ where: { tenantId: tenants[0] } })
    const response = await POST(await request(agent, 'POST', payload(contact.id, account.id)))
    expect(response.status).toBe(201)
    const { property } = await response.json()
    expect(property).toMatchObject({
      ownerId: account.id,
      ownerContactId: contact.id,
      ownerContact: { id: contact.id, name: contact.name },
    })
    expect(Object.keys(property.ownerContact).sort()).toEqual(['id', 'name'])
    expect(await prisma.user.count({ where: { tenantId: tenants[0] } })).toBe(before)
    expect((await GET(await request(account, 'GET'), context(property.id))).status).toBe(200)
    expect((await GET(await request(unlinkedAccount, 'GET'), context(property.id))).status).toBe(
      404,
    )

    const cleared = await PATCH(
      await request(agent, 'PATCH', { ownerContactId: null }),
      context(property.id),
    )
    expect(cleared.status).toBe(200)
    expect((await cleared.json()).property).toMatchObject({
      ownerId: account.id,
      ownerContactId: null,
      ownerContact: null,
    })
    expect((await GET(await request(account, 'GET'), context(property.id))).status).toBe(200)
    expect(
      (
        await PATCH(
          await request(account, 'PATCH', { ownerContactId: contact.id }),
          context(property.id),
        )
      ).status,
    ).toBe(403)
  })

  it('keeps a contact owner without a platform account and allows clearing the access account alone', async () => {
    const created = await POST(await request(staff, 'POST', payload(contact.id, account.id)))
    expect(created.status).toBe(201)
    const id = (await created.json()).property.id
    const cleared = await PATCH(await request(staff, 'PATCH', { ownerId: null }), context(id))
    expect(cleared.status).toBe(200)
    expect((await cleared.json()).property).toMatchObject({
      ownerId: null,
      ownerContactId: contact.id,
    })
    expect((await GET(await request(account, 'GET'), context(id))).status).toBe(404)
    const owned = await listProperties(await request(account, 'GET'))
    expect((await owned.json()).properties.map((p: { id: string }) => p.id)).not.toContain(id)
  })

  it('uses CRM agent visibility for listing and validates every submitted reference', async () => {
    const response = await listContacts(
      await request(agent, 'GET', undefined, 'crm/contacts?page=1&pageSize=25'),
    )
    expect(response.status).toBe(200)
    const ids = (await response.json()).contacts.map((c: { id: string }) => c.id)
    expect(ids).toContain(contact.id)
    for (const unavailable of [hiddenContact, foreignContact, archivedContact]) {
      expect(ids).not.toContain(unavailable.id)
      const created = await POST(await request(agent, 'POST', payload(unavailable.id)))
      expect(created.status).toBe(400)
      expect((await created.json()).error.code).toBe('PROPERTY_OWNER_CONTACT_INVALID')
    }
    const allowed = await POST(await request(staff, 'POST', payload(hiddenContact.id)))
    expect(allowed.status).toBe(201)
    const id = (await allowed.json()).property.id
    const denied = await PATCH(
      await request(staff, 'PATCH', { ownerContactId: foreignContact.id }),
      context(id),
    )
    expect(denied.status).toBe(400)
    expect((await GET(await request(staff, 'GET'), context(id))).status).toBe(200)
    expect(
      (await listContacts(await request(account, 'GET', undefined, 'crm/contacts'))).status,
    ).toBe(403)
  })

  it('preserves historical links after archiving but rejects new links to archived contacts', async () => {
    const historical = await prisma.contact.create({
      data: {
        tenantId: tenants[0],
        createdById: agent.id,
        name: 'Historical owner',
        email: `${randomUUID()}@example.test`,
      },
    })
    const created = await POST(await request(agent, 'POST', payload(historical.id, account.id)))
    expect(created.status).toBe(201)
    const id = (await created.json()).property.id
    await prisma.contact.update({ where: { id: historical.id }, data: { archivedAt: new Date() } })
    const saved = await PATCH(
      await request(agent, 'PATCH', { title: 'Updated title', ownerContactId: historical.id }),
      context(id),
    )
    expect(saved.status).toBe(200)
    expect((await saved.json()).property).toMatchObject({
      ownerContactId: historical.id,
      ownerContact: { name: historical.name },
      ownerId: account.id,
    })
    const denied = await POST(await request(agent, 'POST', payload(historical.id)))
    expect(denied.status).toBe(400)
  })

  it('enforces tenant boundaries in PostgreSQL even when the application is bypassed', async () => {
    await expect(
      prisma.property.create({
        data: {
          tenantId: tenants[0],
          responsibleId: staff.id,
          ownerContactId: foreignContact.id,
          title: 'Invalid tenant reference',
          type: 'HOUSE',
          purpose: 'RENT',
          price: 1000,
        },
      }),
    ).rejects.toMatchObject({ code: 'P2003' })
  })
})
