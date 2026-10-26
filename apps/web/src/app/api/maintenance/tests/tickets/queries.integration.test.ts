import { prisma } from '@server/db/prisma'
import { describe, expect, it } from 'vitest'
import { GET as getTicket } from '../../tickets/[id]/route'
import { POST as createTicket, GET as listTickets } from '../../tickets/route'
import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'

describe('/api/maintenance full summaries and consistent access', () => {
  const env = setupMaintenanceIntegration()
  const { request, context, payload } = env

  it('aggregates every authorized ticket independently of pagination and filters', async () => {
    await prisma.chamadoManutencao.createMany({
      data: Array.from({ length: 125 }, (_value, index) => ({
        tenantId: env.fixture.tenant.id,
        imovelId: env.fixture.property.id,
        contratoId: env.fixture.contract.id,
        categoria: 'PLUMBING',
        titulo: `Ticket ${String(index).padStart(3, '0')}`,
        descricao: 'Real stored ticket',
        abertoPorId: env.fixture.admin.id,
        abertoPorNome: env.fixture.admin.nome,
        prioridade: index >= 100 ? ('URGENTE' as const) : ('NORMAL' as const),
        status: index >= 100 ? ('RESOLVIDO' as const) : ('ABERTO' as const),
        createdAt: new Date('2026-01-01T12:00:00Z'),
        resolvidoEm: index >= 100 ? new Date('2026-01-04T12:00:00Z') : null,
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
        byStatus: { ABERTO: 100, RESOLVIDO: 25 },
        averageResolutionDays: 3,
      },
    })
    expect(body.items.every((item: Record<string, unknown>) => !('access' in item))).toBe(true)
    const filtered = await listTickets(
      request('tickets?status=ABERTO&pageSize=5', 'GET', env.fixture.admin.token),
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
    await prisma.chamadoManutencao.createMany({
      data: Array.from({ length: 5 }, (_value, index) => ({
        tenantId: env.fixture.tenant.id,
        imovelId: env.fixture.property.id,
        contratoId: env.fixture.contract.id,
        categoria: 'PAINTING',
        titulo: `Archived ${index}`,
        descricao: 'Archived ticket',
        abertoPorId: env.fixture.admin.id,
        abertoPorNome: env.fixture.admin.nome,
        excluidoEm: new Date(),
        prioridade: index === 0 ? ('URGENTE' as const) : ('NORMAL' as const),
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
    const otherProperty = await prisma.imovel.create({
      data: {
        tenantId: env.fixture.tenant.id,
        responsavelId: env.fixture.agent.id,
        titulo: 'Second property',
        finalidade: 'ALUGUEL',
        tipo: 'CASA',
        valor: 1000,
      },
    })
    const contract = await env.anotherContract(otherProperty.id)
    const invalid = await prisma.chamadoManutencao.create({
      data: {
        tenantId: env.fixture.tenant.id,
        imovelId: env.fixture.property.id,
        contratoId: contract.id,
        responsavelId: env.fixture.agent.id,
        categoria: 'PLUMBING',
        titulo: 'Inconsistent relation',
        descricao: 'Contract belongs to another property',
        abertoPorId: env.fixture.admin.id,
        abertoPorNome: env.fixture.admin.nome,
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
    const legacy = await env.legacyTicket('ABERTO')
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
        category: 'Hidráulica',
        contractId: env.fixture.contract.id,
        propertyId: env.fixture.property.id,
      }),
    )
    expect(response.status).toBe(201)
    const ticket = (await response.json()).ticket
    expect(ticket.category).toBe('PLUMBING')
    expect(
      (await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id: ticket.id } })).categoria,
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
    expect((await custom.json()).ticket.category).toBe('Serralheria, portões e grades')
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
