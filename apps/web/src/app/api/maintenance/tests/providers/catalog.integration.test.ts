import { prisma } from '@server/db/prisma'
import * as providerAudit from '@server/maintenance/infrastructure/record-maintenance-provider-audit'
import { describe, expect, it, vi } from 'vitest'
import { PATCH as updateProvider } from '../../providers/[id]/route'
import { POST as createProvider, GET as listProviders } from '../../providers/route'
import { GET as getTicket } from '../../tickets/[id]/route'
import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'

const data = {
  name: 'Prestador com vírgula, ponto e espaço',
  phone: '51999990000',
  email: 'provider@example.test',
  notes: 'Atende à tarde\nCombinar antes.',
}

describe('/api/maintenance provider catalog (database integration)', () => {
  const env = setupMaintenanceIntegration()
  const { request, context, action, create } = env
  async function add(name: string, token = env.fixture.admin.token, ticketId?: string) {
    const response = await createProvider(
      request('providers', 'POST', token, {
        provider: { ...data, name },
        ...(ticketId ? { ticketId } : {}),
      }),
    )
    expect(response.status).toBe(201)
    return (await response.json()).provider
  }

  it('creates and reuses an identical provider atomically, with one creation audit', async () => {
    const name = 'Concurrent provider'
    const responses = await Promise.all([
      createProvider(
        request('providers', 'POST', env.fixture.admin.token, { provider: { ...data, name } }),
      ),
      createProvider(
        request('providers', 'POST', env.fixture.admin.token, { provider: { ...data, name } }),
      ),
    ])
    expect(responses.map((response) => response.status)).toEqual([201, 201])
    const first = (await responses[0].json()).provider
    const second = (await responses[1].json()).provider
    expect(first.id).toBe(second.id)
    expect(
      await prisma.prestadorManutencao.count({
        where: { tenantId: env.fixture.tenant.id, nome: name },
      }),
    ).toBe(1)
    expect(
      await prisma.atividadePrestadorManutencao.findMany({ where: { prestadorId: first.id } }),
    ).toMatchObject([{ action: 'CREATED', actorUserId: env.fixture.admin.id, actorRole: 'OWNER' }])
  })

  it('lets linked renters register for the ticket agency and refuses unrelated and unassigned accounts', async () => {
    const id = await create()
    const response = await createProvider(
      request('providers', 'POST', env.fixture.renter.token, {
        ticketId: id,
        provider: { ...data, name: 'Renter chosen' },
      }),
    )
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(
      (await prisma.prestadorManutencao.findUniqueOrThrow({ where: { id: body.provider.id } }))
        .tenantId,
    ).toBe(env.fixture.tenant.id)
    for (const account of [
      env.fixture.agent,
      env.fixture.owner,
      env.fixture.unrelated,
      env.other.renter,
    ]) {
      const denied = await createProvider(
        request('providers', 'POST', account.token, {
          ticketId: id,
          provider: { ...data, name: 'Denied' },
        }),
      )
      expect([403, 404]).toContain(denied.status)
    }
    expect(
      (
        await createProvider(
          request('providers', 'POST', env.fixture.renter.token, { provider: data }),
        )
      ).status,
    ).toBe(403)
    expect(
      (await listProviders(request(`providers?ticketId=${id}`, 'GET', env.fixture.renter.token)))
        .status,
    ).toBe(200)
    expect(
      (
        await listProviders(
          request(`providers?ticketId=${id}&includeInactive=true`, 'GET', env.fixture.renter.token),
        )
      ).status,
    ).toBe(403)
  })

  it('scopes shared-tenant renters to the linked ticket agency instead of their account tenant', async () => {
    const id = await create(env.fixture.admin.token)
    const partyId = env.fixture.contract.partes[0].id
    await prisma.parteContrato.update({
      where: { id: partyId },
      data: { usuarioId: env.other.renter.id, email: env.other.renter.email },
    })
    try {
      const chosen = await add('Shared renter chosen', env.other.renter.token, id)
      expect(
        (await prisma.prestadorManutencao.findUniqueOrThrow({ where: { id: chosen.id } })).tenantId,
      ).toBe(env.fixture.tenant.id)
      const response = await action(id, env.other.renter.token, {
        action: 'provider',
        provider: { id: chosen.id },
      })
      expect(response.status).toBe(200)
      expect((await response.json()).ticket.provider).toMatchObject({
        id: chosen.id,
        name: chosen.name,
      })
    } finally {
      await prisma.parteContrato.update({
        where: { id: partyId },
        data: { usuarioId: env.fixture.renter.id, email: env.fixture.renter.email },
      })
    }
  })

  it('uses catalog data for ID selection and preserves ticket snapshots when the catalog changes', async () => {
    const provider = await add('Snapshot provider')
    const id = await create()
    const chosen = await action(id, env.fixture.renter.token, {
      action: 'provider',
      provider: { id: provider.id, name: 'Forged name', phone: '000' },
    })
    expect(chosen.status).toBe(200)
    const before = (await chosen.json()).ticket
    expect(before.provider).toMatchObject({ ...data, id: provider.id, name: 'Snapshot provider' })
    const changed = await updateProvider(
      request(`providers/${provider.id}`, 'PATCH', env.fixture.admin.token, {
        name: 'Catalog updated',
        phone: '11888887777',
      }),
      context(provider.id),
    )
    expect(changed.status).toBe(200)
    const existing = await getTicket(
      request(`tickets/${id}`, 'GET', env.fixture.renter.token),
      context(id),
    )
    const after = (await existing.json()).ticket
    expect(after.provider).toEqual(before.provider)
    expect(after.activities).toEqual(before.activities)
    const nextId = await create()
    const next = await action(nextId, env.fixture.renter.token, {
      action: 'provider',
      provider: { id: provider.id },
    })
    expect((await next.json()).ticket.provider).toMatchObject({
      id: provider.id,
      name: 'Catalog updated',
      phone: '11888887777',
    })
  })

  it('isolates editing and selection by tenant and reserves catalog updates for agency management', async () => {
    const provider = await add('Protected provider')
    const foreign = await add('Foreign provider', env.other.admin.token)
    for (const account of [env.fixture.agent, env.fixture.owner, env.fixture.renter])
      expect(
        (
          await updateProvider(
            request(`providers/${provider.id}`, 'PATCH', account.token, { name: 'Denied' }),
            context(provider.id),
          )
        ).status,
      ).toBe(403)
    expect(
      (
        await updateProvider(
          request(`providers/${provider.id}`, 'PATCH', env.other.admin.token, { name: 'Denied' }),
          context(provider.id),
        )
      ).status,
    ).toBe(404)
    const id = await create()
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'provider',
          provider: { id: foreign.id },
        })
      ).status,
    ).toBe(404)
    const response = await listProviders(
      request('providers?search=Foreign', 'GET', env.fixture.admin.token),
    )
    expect((await response.json()).items).toEqual([])
  })

  it('keeps inactive providers in history and requires management to reactivate an identical registration', async () => {
    const provider = await add('Inactive provider')
    const id = await create()
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'provider',
          provider: { id: provider.id },
        })
      ).status,
    ).toBe(200)
    expect(
      (
        await updateProvider(
          request(`providers/${provider.id}`, 'PATCH', env.fixture.admin.token, { active: false }),
          context(provider.id),
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await (
          await listProviders(request('providers?search=Inactive', 'GET', env.fixture.admin.token))
        ).json()
      ).items,
    ).toEqual([])
    const withInactive = await listProviders(
      request('providers?search=Inactive&includeInactive=true', 'GET', env.fixture.admin.token),
    )
    expect((await withInactive.json()).items).toMatchObject([{ id: provider.id, active: false }])
    expect(
      (
        await (
          await getTicket(request(`tickets/${id}`, 'GET', env.fixture.renter.token), context(id))
        ).json()
      ).ticket.provider.id,
    ).toBe(provider.id)
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'provider',
          provider: { id: provider.id },
        })
      ).status,
    ).toBe(409)
    expect(
      (
        await createProvider(
          request('providers', 'POST', env.fixture.renter.token, {
            ticketId: id,
            provider: { ...data, name: 'Inactive provider' },
          }),
        )
      ).status,
    ).toBe(409)
    expect(
      (
        await updateProvider(
          request(`providers/${provider.id}`, 'PATCH', env.fixture.admin.token, { active: true }),
          context(provider.id),
        )
      ).status,
    ).toBe(200)
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'provider',
          provider: { id: provider.id },
        })
      ).status,
    ).toBe(200)
  })

  it('paginates and searches beyond the first page', async () => {
    for (let index = 0; index < 7; index++) await add(`Page provider ${index}`)
    const second = await listProviders(
      request('providers?search=Page%20provider&page=2&pageSize=5', 'GET', env.fixture.admin.token),
    )
    expect(await second.json()).toMatchObject({
      totalCount: 7,
      page: 2,
      pageSize: 5,
      items: [{ name: 'Page provider 5' }, { name: 'Page provider 6' }],
    })
    const found = await listProviders(
      request('providers?search=Page%20provider%206', 'GET', env.fixture.admin.token),
    )
    expect((await found.json()).items).toMatchObject([{ name: 'Page provider 6' }])
  })

  it('rolls back the provider, ticket and history if the catalog audit fails', async () => {
    const id = await create()
    const before = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
    const activities = await prisma.atividadeChamadoManutencao.count({ where: { chamadoId: id } })
    const spy = vi
      .spyOn(providerAudit, 'recordMaintenanceProviderAudit')
      .mockRejectedValueOnce(new Error('Forced provider audit failure'))
    try {
      expect(
        (
          await action(id, env.fixture.renter.token, {
            action: 'provider',
            provider: { name: 'Rollback provider' },
          })
        ).status,
      ).toBe(500)
      expect(await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })).toEqual(before)
      expect(
        await prisma.prestadorManutencao.count({
          where: { tenantId: env.fixture.tenant.id, nome: 'Rollback provider' },
        }),
      ).toBe(0)
      expect(await prisma.atividadeChamadoManutencao.count({ where: { chamadoId: id } })).toBe(
        activities,
      )
    } finally {
      spy.mockRestore()
    }
  })
})
