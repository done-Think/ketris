import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'
import { describe, expect, it } from 'vitest'
import { GET } from '../../tickets/route'
import { GET as getTicket, PATCH } from '../../tickets/[id]/route'

describe('/api/maintenance scheduling (database integration)', () => {
  const env = setupMaintenanceIntegration()
  const { request, context, create, action } = env
  it('stores appointment dates and returns them on renter lists while staff retains rescheduling control', async () => {
    const id = await create(env.fixture.renter.token)
    const scheduledAt = '2026-10-24T14:00:00.000Z'
    expect(
      (await action(id, env.fixture.renter.token, { action: 'schedule', scheduledAt })).status,
    ).toBe(403)
    expect(
      (
        await PATCH(
          request(`tickets/${id}`, 'PATCH', env.fixture.admin.token, { scheduledAt }),
          context(id),
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'provider',
          provider: { name: 'Selected provider' },
        })
      ).status,
    ).toBe(200)
    expect(
      (await action(id, env.fixture.renter.token, { action: 'schedule', scheduledAt })).status,
    ).toBe(200)
    expect(
      (await action(id, env.fixture.unrelated.token, { action: 'schedule', scheduledAt })).status,
    ).toBe(404)
    const updated = await PATCH(
      request(`tickets/${id}`, 'PATCH', env.fixture.admin.token, { scheduledAt }),
      context(id),
    )
    expect(updated.status).toBe(200)
    expect((await updated.json()).ticket.scheduledAt).toBe(scheduledAt)
    const list = await GET(request('tickets', 'GET', env.fixture.renter.token))
    expect((await list.json()).items).toContainEqual(expect.objectContaining({ id, scheduledAt }))
    expect(
      (
        await PATCH(
          request(`tickets/${id}`, 'PATCH', env.fixture.renter.token, { scheduledAt: null }),
          context(id),
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await PATCH(
          request(`tickets/${id}`, 'PATCH', env.fixture.admin.token, { scheduledAt: 'invalid' }),
          context(id),
        )
      ).status,
    ).toBe(400)
    const removed = await PATCH(
      request(`tickets/${id}`, 'PATCH', env.fixture.admin.token, { scheduledAt: null }),
      context(id),
    )
    expect((await removed.json()).ticket.scheduledAt).toBeNull()
    const detail = await getTicket(
      request(`tickets/${id}`, 'GET', env.fixture.renter.token),
      context(id),
    )
    expect((await detail.json()).ticket.activities).toContainEqual(
      expect.objectContaining({
        authorId: env.fixture.renter.id,
        type: 'EDICAO',
        details: {
          before: { scheduledAt: null },
          after: { scheduledAt },
          provider: 'Selected provider',
        },
      }),
    )
  })
})
