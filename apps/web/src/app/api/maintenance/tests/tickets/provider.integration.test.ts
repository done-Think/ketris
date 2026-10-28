import { prisma } from '@server/db/prisma'
import { describe, expect, it } from 'vitest'
import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'

describe('/api/maintenance provider (database integration)', () => {
  const env = setupMaintenanceIntegration()
  const { create, action } = env
  it.each(['OPEN', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'DISPUTED'] as const)(
    'lets the linked renter define a provider in %s and preserves original data and history',
    async (status) => {
      const id = await create(env.fixture.admin.token)
      await prisma.maintenanceTicket.update({ where: { id }, data: { status } })
      const before = await prisma.maintenanceTicket.findUniqueOrThrow({ where: { id } })
      for (const user of [env.fixture.unrelated, env.other.renter]) {
        expect(
          (await action(id, user.token, { action: 'provider', provider: { name: 'Denied' } }))
            .status,
        ).toBe(404)
      }
      expect(
        (
          await action(id, env.fixture.renter.token, {
            action: 'provider',
            provider: { name: ' ' },
          })
        ).status,
      ).toBe(400)
      const provider = {
        name: 'Chosen provider',
        phone: '51999990000',
        email: 'provider@example.test',
        notes: 'Plumbing',
      }
      expect(
        (
          await action(id, env.fixture.renter.token, {
            action: 'provider',
            provider,
            title: 'Overwrite',
          })
        ).status,
      ).toBe(400)
      const response = await action(id, env.fixture.renter.token, { action: 'provider', provider })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.ticket).toMatchObject({
        provider,
        status,
        title: before.title,
        description: before.description,
        contractId: before.contractId,
        propertyId: before.propertyId,
        permissions: { provider: true, edit: false, delete: false },
      })
      const updated = await action(id, env.fixture.renter.token, {
        action: 'provider',
        provider: { ...provider, name: 'New provider' },
      })
      expect(updated.status).toBe(200)
      const ticket = (await updated.json()).ticket
      expect(ticket.activities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Chamado aberto.' }),
          expect.objectContaining({
            type: 'PROVIDER_CHANGED',
            authorId: env.fixture.renter.id,
            details: { before: null, after: { ...provider, id: body.ticket.provider.id } },
          }),
          expect.objectContaining({
            type: 'PROVIDER_CHANGED',
            authorId: env.fixture.renter.id,
            details: {
              before: { ...provider, id: body.ticket.provider.id },
              after: { ...provider, name: 'New provider', id: ticket.provider.id },
            },
          }),
        ]),
      )
    },
  )

  it.each(['RESOLVED', 'CANCELED', 'CLOSED'] as const)(
    'blocks renter provider changes in %s',
    async (status) => {
      const id = await create()
      await prisma.maintenanceTicket.update({ where: { id }, data: { status } })
      expect(
        (
          await action(id, env.fixture.renter.token, {
            action: 'provider',
            provider: { name: 'Denied' },
          })
        ).status,
      ).toBe(409)
    },
  )

  it('blocks renter provider changes on archived and legacy tickets', async () => {
    const archived = await create()
    await prisma.maintenanceTicket.update({
      where: { id: archived },
      data: { deletedAt: new Date() },
    })
    const legacy = await create()
    await prisma.maintenanceTicket.update({ where: { id: legacy }, data: { contractId: null } })
    for (const id of [archived, legacy])
      expect(
        (
          await action(id, env.fixture.renter.token, {
            action: 'provider',
            provider: { name: 'Denied' },
          })
        ).status,
      ).toBe(404)
  })

  it('records provider replacement requests and approval snapshots', async () => {
    const id = await create()
    await action(id, env.fixture.admin.token, {
      action: 'provider',
      provider: { name: 'Old vendor' },
    })
    expect(
      (
        await action(id, env.fixture.owner.token, {
          action: 'provider',
          provider: { name: 'Denied' },
        })
      ).status,
    ).toBe(403)
    const response = await action(id, env.fixture.owner.token, {
      action: 'requestReplacement',
      reason: 'Unreliable',
    })
    const pending = (await response.json()).ticket.replacementRequests[0]
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'provider',
          provider: { name: 'Blocked while pending' },
        })
      ).status,
    ).toBe(409)
    expect(
      (
        await action(id, env.fixture.admin.token, {
          action: 'rejectReplacement',
          requestId: pending.id,
          reason: ' ',
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await action(id, env.fixture.admin.token, {
          action: 'approveReplacement',
          requestId: pending.id,
          provider: { name: 'New vendor' },
        })
      ).status,
    ).toBe(200)
    const row = await prisma.maintenanceTicket.findUniqueOrThrow({
      where: { id },
      include: { activities: true, changeRequests: true },
    })
    expect(row.providerName).toBe('New vendor')
    expect(row.changeRequests[0].status).toBe('APPROVED')
    expect(row.activities.find((a) => a.type === 'CHANGE_DECIDED')?.details).toMatchObject({
      before: { name: 'Old vendor' },
      after: { name: 'New vendor' },
    })
  })
})
