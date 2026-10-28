vi.mock('@server/maintenance/infrastructure/s3-maintenance-attachment-storage', async () => {
  const { uploadToStorage, downloadFromStorage } = await import('../fixtures/maintenance-storage')
  return {
    S3MaintenanceAttachmentStorage: class {
      upload = uploadToStorage
      download = downloadFromStorage
    },
  }
})
import { prisma } from '@server/db/prisma'
import type { MaintenanceTicketListItem } from '@server/maintenance/types/maintenance-ticket'
import { describe, expect, it, vi } from 'vitest'
import { GET as options } from '../../options/route'
import { GET as listActivities } from '../../tickets/[id]/activities/route'
import { POST as attachFile } from '../../tickets/[id]/attachments/route'
import { POST as addNote } from '../../tickets/[id]/notes/route'
import { DELETE, GET as getTicket, PATCH } from '../../tickets/[id]/route'
import { GET, POST } from '../../tickets/route'
import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'

describe('/api/maintenance access (database integration)', () => {
  const env = setupMaintenanceIntegration()
  const { request, context, payload, create, action, attachmentRequest, uploadToStorage } = env
  it.each(['RESOLVED', 'CANCELED', 'CLOSED'] as const)(
    'preserves linked renter reading of %s tickets with timeline and attachments',
    async (status) => {
      const id = await create()
      const note = await addNote(
        request(`tickets/${id}/notes`, 'POST', env.fixture.renter.token, {
          message: 'Repair photo attached.',
        }),
        context(id),
      )
      expect(note.status).toBe(201)
      const attachment = await attachFile(
        attachmentRequest(id, env.fixture.renter.token),
        context(id),
      )
      expect(attachment.status).toBe(201)
      const attachmentBody = await attachment.json()
      await prisma.maintenanceTicket.update({ where: { id }, data: { status } })
      const detail = await getTicket(
        request(`tickets/${id}`, 'GET', env.fixture.renter.token),
        context(id),
      )
      expect(detail.status).toBe(200)
      const body = await detail.json()
      expect(body.ticket.status).toBe(status)
      expect(body.ticket.activities).toEqual(
        expect.arrayContaining([expect.objectContaining({ message: 'Repair photo attached.' })]),
      )
      expect(body.ticket.attachments).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: attachmentBody.attachment.id })]),
      )
      expect(body.ticket.permissions).toMatchObject({
        edit: false,
        collaborate: false,
        comment: status === 'RESOLVED',
        reopen: status === 'RESOLVED',
        confirm: false,
      })
      const list = await GET(request(`tickets?status=${status}`, 'GET', env.fixture.renter.token))
      expect((await list.json()).items).toEqual(
        expect.arrayContaining([expect.objectContaining({ id })]),
      )
      expect(
        (
          await listActivities(
            request(`tickets/${id}/activities`, 'GET', env.fixture.renter.token),
            context(id),
          )
        ).status,
      ).toBe(200)
      const uploadCount = uploadToStorage.mock.calls.length
      expect(
        (await attachFile(attachmentRequest(id, env.fixture.renter.token), context(id))).status,
      ).toBe(409)
      expect(uploadToStorage).toHaveBeenCalledTimes(uploadCount)
      expect(
        (
          await PATCH(
            request(`tickets/${id}`, 'PATCH', env.fixture.renter.token, { title: 'Denied' }),
            context(id),
          )
        ).status,
      ).toBe(409)
      expect(
        (
          await addNote(
            request(`tickets/${id}/notes`, 'POST', env.fixture.renter.token, {
              message: 'Additional detail',
            }),
            context(id),
          )
        ).status,
      ).toBe(status === 'RESOLVED' ? 201 : 409)
      for (const user of [env.fixture.unrelated, env.other.renter]) {
        expect(
          (await getTicket(request(`tickets/${id}`, 'GET', user.token), context(id))).status,
        ).toBe(404)
        expect((await attachFile(attachmentRequest(id, user.token), context(id))).status).toBe(404)
      }
      expect(uploadToStorage).toHaveBeenCalledTimes(uploadCount)
    },
  )

  it('does not grant renters internal management or confirmation permissions', async () => {
    const id = await create()
    const actions = [
      { action: 'assume' },
      { action: 'assign', responsibleId: env.fixture.agent.id },
      { action: 'requestReplacement', reason: 'Denied' },
      { action: 'start' },
      { action: 'complete' },
      { action: 'cancel' },
    ]
    for (const input of actions)
      expect((await action(id, env.fixture.renter.token, input)).status).toBe(403)
    await prisma.maintenanceTicket.update({
      where: { id },
      data: { status: 'AWAITING_CONFIRMATION' },
    })
    expect((await action(id, env.fixture.renter.token, { action: 'confirm' })).status).toBe(403)
    expect(
      (await action(id, env.fixture.renter.token, { action: 'contest', reason: 'Still leaking' }))
        .status,
    ).toBe(200)
    expect(
      (await DELETE(request(`tickets/${id}`, 'DELETE', env.fixture.renter.token), context(id)))
        .status,
    ).toBe(403)
  })

  it('requires authentication', async () =>
    expect((await GET(request('tickets', 'GET'))).status).toBe(401))

  it('creates for all linked roles and refuses another tenants contract', async () => {
    for (const user of [
      env.fixture.admin,
      env.fixture.agent,
      env.fixture.owner,
      env.fixture.renter,
    ])
      await create(user.token)
    expect(
      (
        await POST(
          request('tickets', 'POST', env.fixture.renter.token, {
            ...payload,
            contractId: env.other.contract.id,
          }),
        )
      ).status,
    ).toBe(404)
    expect(
      (
        await POST(
          request('tickets', 'POST', env.fixture.unrelated.token, {
            ...payload,
            contractId: env.fixture.contract.id,
          }),
        )
      ).status,
    ).toBe(404)
  })

  it('filters list and options by explicit membership, including same-tenant isolation', async () => {
    const id = await create()
    const allowed = await GET(request('tickets', 'GET', env.fixture.renter.token))
    expect(
      (await allowed.json()).items.map((item: Pick<MaintenanceTicketListItem, 'id'>) => item.id),
    ).toContain(id)
    const denied = await GET(request('tickets', 'GET', env.fixture.unrelated.token))
    expect(await denied.json()).toMatchObject({
      items: [],
      totalCount: 0,
      summary: { totalCount: 0, urgentCount: 0 },
    })
    expect(
      (await (await options(request('options', 'GET', env.fixture.unrelated.token))).json())
        .contracts,
    ).toEqual([])
    for (const user of [env.fixture.unrelated, env.other.admin]) {
      expect(
        (await getTicket(request(`tickets/${id}`, 'GET', user.token), context(id))).status,
      ).toBe(404)
      expect(
        (
          await PATCH(
            request(`tickets/${id}`, 'PATCH', user.token, { title: 'Changed' }),
            context(id),
          )
        ).status,
      ).toBe(404)
      expect(
        (await listActivities(request(`tickets/${id}/activities`, 'GET', user.token), context(id)))
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
      expect(
        (await DELETE(request(`tickets/${id}`, 'DELETE', user.token), context(id))).status,
      ).toBe(404)
    }
  })

  it('allows renter notes but never edits original fields, including own OPEN calls', async () => {
    const id = await create(env.fixture.admin.token)
    expect(
      (
        await addNote(
          request(`tickets/${id}/notes`, 'POST', env.fixture.renter.token, { message: 'Comment' }),
          context(id),
        )
      ).status,
    ).toBe(201)
    expect(
      (
        await PATCH(
          request(`tickets/${id}`, 'PATCH', env.fixture.renter.token, { title: 'Denied' }),
          context(id),
        )
      ).status,
    ).toBe(403)
    const own = await create()
    expect(
      (
        await PATCH(
          request(`tickets/${own}`, 'PATCH', env.fixture.renter.token, { title: 'Denied' }),
          context(own),
        )
      ).status,
    ).toBe(403)
    expect((await action(own, env.fixture.renter.token, { action: 'cancel' })).status).toBe(403)
    expect((await action(own, env.fixture.renter.token, { action: 'complete' })).status).toBe(403)
  })

  it('preserves excluded records and permits only admin to list/restore them', async () => {
    const id = await create()
    expect(
      (await DELETE(request(`tickets/${id}`, 'DELETE', env.fixture.renter.token), context(id)))
        .status,
    ).toBe(403)
    expect(
      (await DELETE(request(`tickets/${id}`, 'DELETE', env.fixture.admin.token), context(id)))
        .status,
    ).toBe(204)
    expect(
      (await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id } })).deletedAt,
    ).not.toBeNull()
    expect(
      (await getTicket(request(`tickets/${id}`, 'GET', env.fixture.renter.token), context(id)))
        .status,
    ).toBe(404)
    expect(
      (await GET(request('tickets?archived=true', 'GET', env.fixture.renter.token))).status,
    ).toBe(403)
    const archived = await GET(request('tickets?archived=true', 'GET', env.fixture.admin.token))
    expect(
      (await archived.json()).items.map((item: Pick<MaintenanceTicketListItem, 'id'>) => item.id),
    ).toContain(id)
    expect((await action(id, env.fixture.admin.token, { action: 'restore' })).status).toBe(200)
    const row = await prisma.maintenanceTicket.findUniqueOrThrow({
      where: { id },
      include: { activities: true },
    })
    expect(row.deletedAt).toBeNull()
    expect(row.status).toBe('OPEN')
    expect(row.activities.map((a) => a.type)).toEqual(
      expect.arrayContaining(['DELETION', 'RESTORATION']),
    )
  })
})
