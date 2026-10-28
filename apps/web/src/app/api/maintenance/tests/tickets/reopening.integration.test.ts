import { prisma } from '@server/db/prisma'
import { describe, expect, it } from 'vitest'
import { POST as addNote } from '../../tickets/[id]/notes/route'
import { PATCH } from '../../tickets/[id]/route'
import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'

describe('/api/maintenance reopening (database integration)', () => {
  const env = setupMaintenanceIntegration()
  const { request, context, create, action } = env
  it('preserves original data and history when a linked renter adds notes and reopens a resolved ticket', async () => {
    const id = await create(env.fixture.admin.token)
    const resolvedAt = new Date('2026-10-19T10:00:00Z')
    await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: resolvedAt,
        completedById: env.fixture.agent.id,
        completedByRole: 'AGENT',
      },
    })
    const before = await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id } })
    const note = await addNote(
      request(`tickets/${id}/notes`, 'POST', env.fixture.renter.token, {
        message: ' Additional detail ',
      }),
      context(id),
    )
    expect(note.status).toBe(201)
    const noteBody = await note.json()
    const afterNote = await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id } })
    expect(afterNote).toMatchObject({
      status: 'RESOLVED',
      resolvedAt: resolvedAt,
      title: before.title,
      description: before.description,
    })
    for (const user of [env.fixture.unrelated, env.other.renter]) {
      expect(
        (await action(id, user.token, { action: 'reopen', status: 'OPEN', reason: 'Denied' }))
          .status,
      ).toBe(404)
      expect(
        (
          await addNote(
            request(`tickets/${id}/notes`, 'POST', user.token, { message: 'Denied' }),
            context(id),
          )
        ).status,
      ).toBe(404)
    }
    expect(
      (await action(id, env.fixture.renter.token, { action: 'reopen', status: 'OPEN' })).status,
    ).toBe(409)
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'reopen',
          status: 'OPEN',
          reason: ' ',
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'reopen',
          status: 'IN_PROGRESS',
          reason: 'Denied',
        })
      ).status,
    ).toBe(403)
    const reopened = await action(id, env.fixture.renter.token, {
      action: 'reopen',
      status: 'OPEN',
      reason: ' Leak returned ',
    })
    expect(reopened.status).toBe(200)
    const body = await reopened.json()
    expect(body.ticket).toMatchObject({
      status: 'OPEN',
      resolvedAt: null,
      title: before.title,
      description: before.description,
      category: before.category,
      priority: before.priority,
      contractId: before.contractId,
      propertyId: before.propertyId,
      permissions: { edit: false, comment: true, collaborate: true },
    })
    expect(body.ticket.activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'Chamado aberto.' }),
        expect.objectContaining({
          id: noteBody.activity.id,
          message: 'Additional detail',
          authorId: env.fixture.renter.id,
        }),
        expect.objectContaining({
          type: 'STATUS_CHANGE',
          authorId: env.fixture.renter.id,
          message: 'Leak returned',
          details: {
            before: 'RESOLVED',
            after: 'OPEN',
            reason: 'Leak returned',
            previousResolution: { resolvedAt: resolvedAt.toISOString(), completedByRole: 'AGENT' },
          },
        }),
      ]),
    )
    expect(
      (
        await PATCH(
          request(`tickets/${id}`, 'PATCH', env.fixture.renter.token, { description: 'Overwrite' }),
          context(id),
        )
      ).status,
    ).toBe(403)
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'reopen',
          status: 'OPEN',
          reason: 'Repeat',
        })
      ).status,
    ).toBe(403)
  })

  it.each(['CANCELED', 'CLOSED'] as const)(
    'blocks renter reopening of %s tickets',
    async (status) => {
      const id = await create()
      await prisma.maintenanceTicket.update({ where: { id }, data: { status } })
      expect(
        (
          await action(id, env.fixture.renter.token, {
            action: 'reopen',
            status: 'OPEN',
            reason: 'Denied',
          })
        ).status,
      ).toBe(409)
    },
  )

  it('blocks renter notes and reopening of archived resolved tickets', async () => {
    const id = await create()
    await prisma.maintenanceTicket.update({
      where: { id },
      data: { status: 'RESOLVED', deletedAt: new Date() },
    })
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'reopen',
          status: 'OPEN',
          reason: 'Denied',
        })
      ).status,
    ).toBe(404)
    expect(
      (
        await addNote(
          request(`tickets/${id}/notes`, 'POST', env.fixture.renter.token, { message: 'Denied' }),
          context(id),
        )
      ).status,
    ).toBe(404)
  })
})
