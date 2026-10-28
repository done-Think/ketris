import { prisma } from '@server/db/prisma'
import { describe, expect, it } from 'vitest'
import { GET as getTicket } from '../../tickets/[id]/route'
import { POST as createTicket, GET as listTickets } from '../../tickets/route'
import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'

describe('/api/maintenance full summaries and consistent access', () => {
  const env = setupMaintenanceIntegration()
  const { request, context, payload } = env

  it('filters exact categories while preserving global metrics and access', async () => {
    const ids = new Map<string, string>()
    try {
      for (const category of ['PLUMBING', 'ELECTRICAL', 'OTHER']) {
        const response = await createTicket(
          request('tickets', 'POST', env.fixture.admin.token, {
            ...payload,
            contractId: env.fixture.contract.id,
            category,
          }),
        )
        expect(response.status).toBe(201)
        ids.set(category, (await response.json()).ticket.id)
      }
      const global = await (
        await listTickets(request('tickets', 'GET', env.fixture.admin.token))
      ).json()
      for (const [query, category] of [
        ['PLUMBING', 'PLUMBING'],
        ['ELECTRICAL', 'ELECTRICAL'],
        ['OTHER', 'OTHER'],
      ]) {
        const response = await listTickets(
          request(
            `tickets?category=${encodeURIComponent(query)}&pageSize=5`,
            'GET',
            env.fixture.admin.token,
          ),
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toMatchObject({
          items: [{ id: ids.get(category), category }],
          totalCount: 1,
          summary: global.summary,
        })
      }
      const denied = await listTickets(
        request('tickets?category=ELECTRICAL', 'GET', env.fixture.unrelated.token),
      )
      expect(await denied.json()).toMatchObject({ items: [], totalCount: 0 })
      expect(
        (await listTickets(request('tickets?category=', 'GET', env.fixture.admin.token))).status,
      ).toBe(400)
    } finally {
      await prisma.maintenanceTicket.deleteMany({ where: { id: { in: [...ids.values()] } } })
    }
  })

  it('aggregates every authorized ticket independently of pagination and filters', async () => {
    await prisma.maintenanceTicket.createMany({
      data: Array.from({ length: 125 }, (_value, index) => ({
        tenantId: env.fixture.tenant.id,
        propertyId: env.fixture.property.id,
        contractId: env.fixture.contract.id,
        category: 'PLUMBING',
        title: `Ticket ${String(index).padStart(3, '0')}`,
        description: 'Real stored ticket',
        openedById: env.fixture.admin.id,
        openedByName: env.fixture.admin.name,
        priority: index >= 100 ? ('URGENT' as const) : ('NORMAL' as const),
        status: index >= 100 ? ('RESOLVED' as const) : ('OPEN' as const),
        createdAt: new Date('2026-01-01T12:00:00Z'),
        resolvedAt: index >= 100 ? new Date('2026-01-04T12:00:00Z') : null,
        updatedAt: new Date(new Date('2026-01-05T12:00:00Z').getTime() + index * 1000),
      })),
    })
    const response = await listTickets(
      request('tickets?pageSize=5', 'GET', env.fixture.admin.token),
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(5)
    expect(body).toMatchObject({
      totalCount: 125,
      pagination: { page: 1, pageCount: 25 },
      summary: {
        totalCount: 125,
        urgentCount: 25,
        byStatus: { OPEN: 100, RESOLVED: 25 },
        averageResolutionDays: 3,
      },
    })
    expect(body.items.every((item: Record<string, unknown>) => !('access' in item))).toBe(true)
    const filtered = await listTickets(
      request('tickets?status=OPEN&pageSize=5', 'GET', env.fixture.admin.token),
    )
    expect(await filtered.json()).toMatchObject({ totalCount: 100, summary: body.summary })
    const found = await listTickets(
      request('tickets?search=Ticket%20124', 'GET', env.fixture.admin.token),
    )
    expect(await found.json()).toMatchObject({
      totalCount: 1,
      items: [{ title: 'Ticket 124' }],
      summary: body.summary,
    })
    const last = await listTickets(
      request('tickets?page=999&pageSize=5', 'GET', env.fixture.admin.token),
    )
    expect(await last.json()).toMatchObject({
      pagination: { page: 25, pageCount: 25 },
      items: [
        { title: 'Ticket 004' },
        { title: 'Ticket 003' },
        { title: 'Ticket 002' },
        { title: 'Ticket 001' },
        { title: 'Ticket 000' },
      ],
    })
    for (const account of [env.fixture.renter, env.fixture.agent]) {
      const allowed = await listTickets(request('tickets?pageSize=5', 'GET', account.token))
      expect((await allowed.json()).summary).toEqual(body.summary)
    }
    for (const account of [env.fixture.unrelated, env.fixture.unrelatedAgent, env.other.renter]) {
      const denied = await listTickets(request('tickets', 'GET', account.token))
      expect(await denied.json()).toMatchObject({
        items: [],
        totalCount: 0,
        summary: { totalCount: 0, urgentCount: 0, byStatus: {}, averageResolutionDays: null },
      })
    }
    await prisma.maintenanceTicket.createMany({
      data: Array.from({ length: 5 }, (_value, index) => ({
        tenantId: env.fixture.tenant.id,
        propertyId: env.fixture.property.id,
        contractId: env.fixture.contract.id,
        category: 'PAINTING',
        title: `Archived ${index}`,
        description: 'Archived ticket',
        openedById: env.fixture.admin.id,
        openedByName: env.fixture.admin.name,
        deletedAt: new Date(),
        priority: index === 0 ? ('URGENT' as const) : ('NORMAL' as const),
      })),
    })
    const archived = await listTickets(
      request('tickets?archived=true', 'GET', env.fixture.admin.token),
    )
    expect(await archived.json()).toMatchObject({
      totalCount: 5,
      summary: { totalCount: 5, urgentCount: 1 },
    })
    expect(
      (await listTickets(request('tickets?archived=true', 'GET', env.fixture.renter.token))).status,
    ).toBe(403)
  })

  it('keeps inconsistent and legacy relationships visible only to management', async () => {
    const otherProperty = await prisma.property.create({
      data: {
        tenantId: env.fixture.tenant.id,
        responsibleId: env.fixture.agent.id,
        title: 'Second property',
        purpose: 'RENT',
        type: 'HOUSE',
        price: 1000,
      },
    })
    const contract = await env.anotherContract(otherProperty.id)
    const invalid = await prisma.maintenanceTicket.create({
      data: {
        tenantId: env.fixture.tenant.id,
        propertyId: env.fixture.property.id,
        contractId: contract.id,
        responsibleId: env.fixture.agent.id,
        category: 'PLUMBING',
        title: 'Inconsistent relation',
        description: 'Contract belongs to another property',
        openedById: env.fixture.admin.id,
        openedByName: env.fixture.admin.name,
      },
    })
    const manager = await listTickets(
      request('tickets?search=Inconsistent', 'GET', env.fixture.admin.token),
    )
    expect((await manager.json()).items).toMatchObject([{ id: invalid.id }])
    for (const token of [
      env.fixture.agent.token,
      env.fixture.owner.token,
      env.fixture.renter.token,
      contract.renterToken,
    ]) {
      const response = await listTickets(request('tickets?search=Inconsistent', 'GET', token))
      expect(await response.json()).toMatchObject({ items: [], totalCount: 0 })
      expect(
        (await getTicket(request(`tickets/${invalid.id}`, 'GET', token), context(invalid.id)))
          .status,
      ).toBe(404)
    }
    const legacy = await env.legacyTicket('OPEN')
    expect(
      (
        await (
          await listTickets(request('tickets?search=Legacy', 'GET', env.fixture.admin.token))
        ).json()
      ).items,
    ).toMatchObject([{ id: legacy.id }])
    expect(
      (
        await (
          await listTickets(request('tickets?search=Legacy', 'GET', env.fixture.agent.token))
        ).json()
      ).items,
    ).toEqual([])
  })

  it('normalizes the four built-in categories and preserves additional categories and supported fields', async () => {
    const response = await createTicket(
      request('tickets', 'POST', env.fixture.admin.token, {
        ...payload,
        category: 'PLUMBING',
        contractId: env.fixture.contract.id,
        propertyId: env.fixture.property.id,
      }),
    )
    expect(response.status).toBe(201)
    const ticket = (await response.json()).ticket
    expect(ticket.category).toBe('PLUMBING')
    expect(
      (await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id: ticket.id } })).category,
    ).toBe('PLUMBING')
    for (const [search, locale] of [
      ['Hidraulica', 'pt-BR'],
      ['Plumbing', 'en-US'],
      ['Fontanería', 'es-ES'],
    ]) {
      const found = await listTickets(
        request(
          `tickets?search=${encodeURIComponent(search)}&locale=${locale}`,
          'GET',
          env.fixture.admin.token,
        ),
      )
      expect((await found.json()).items).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: ticket.id })]),
      )
    }
    const custom = await createTicket(
      request('tickets', 'POST', env.fixture.admin.token, {
        ...payload,
        category: 'Serralheria, portões e grades',
        contractId: env.fixture.contract.id,
      }),
    )
    expect(custom.status).toBe(400)
    const legacyFilter = await listTickets(
      request('tickets?category=Hidr%C3%A1ulica', 'GET', env.fixture.admin.token),
    )
    expect(legacyFilter.status).toBe(400)
    const rejected = await createTicket(
      request('tickets', 'POST', env.fixture.admin.token, {
        ...payload,
        contractId: env.fixture.contract.id,
        unknownField: 'must not disappear',
      }),
    )
    expect(rejected.status).toBe(400)
  })
})
