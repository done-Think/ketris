import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'
import { describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { PATCH } from '../../tickets/[id]/route'
import { POST as addNote } from '../../tickets/[id]/notes/route'

describe('/api/maintenance reopening (database integration)', () => {
  const env = setupMaintenanceIntegration()
  const { request, context, create, action } = env
  it('preserves original data and history when a linked renter adds notes and reopens a resolved ticket', async () => {
    const id = await create(env.fixture.admin.token)
    const resolvedAt = new Date('2026-10-19T10:00:00Z')
    await prisma.chamadoManutencao.update({
      where: { id },
      data: {
        status: 'RESOLVIDO',
        resolvidoEm: resolvedAt,
        concluidoPorId: env.fixture.agent.id,
        concluidoPorPapel: 'AGENT',
      },
    })
    const before = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
    const note = await addNote(
      request(`tickets/${id}/notes`, 'POST', env.fixture.renter.token, {
        message: ' Additional detail ',
      }),
      context(id),
    )
    expect(note.status).toBe(201)
    const noteBody = await note.json()
    const afterNote = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
    expect(afterNote).toMatchObject({
      status: 'RESOLVIDO',
      resolvidoEm: resolvedAt,
      titulo: before.titulo,
      descricao: before.descricao,
    })
    for (const user of [env.fixture.unrelated, env.other.renter]) {
      expect(
        (await action(id, user.token, { action: 'reopen', status: 'ABERTO', reason: 'Denied' }))
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
      (await action(id, env.fixture.renter.token, { action: 'reopen', status: 'ABERTO' })).status,
    ).toBe(409)
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'reopen',
          status: 'ABERTO',
          reason: ' ',
        })
      ).status,
    ).toBe(400)
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'reopen',
          status: 'EM_ANDAMENTO',
          reason: 'Denied',
        })
      ).status,
    ).toBe(403)
    const reopened = await action(id, env.fixture.renter.token, {
      action: 'reopen',
      status: 'ABERTO',
      reason: ' Leak returned ',
    })
    expect(reopened.status).toBe(200)
    const body = await reopened.json()
    expect(body.ticket).toMatchObject({
      status: 'ABERTO',
      resolvedAt: null,
      title: before.titulo,
      description: before.descricao,
      category: before.categoria,
      priority: before.prioridade,
      contractId: before.contratoId,
      propertyId: before.imovelId,
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
          type: 'MUDANCA_STATUS',
          authorId: env.fixture.renter.id,
          message: 'Leak returned',
          details: {
            before: 'RESOLVIDO',
            after: 'ABERTO',
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
          status: 'ABERTO',
          reason: 'Repeat',
        })
      ).status,
    ).toBe(403)
  })

  it.each(['CANCELADO', 'FECHADO'] as const)(
    'blocks renter reopening of %s tickets',
    async (status) => {
      const id = await create()
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      expect(
        (
          await action(id, env.fixture.renter.token, {
            action: 'reopen',
            status: 'ABERTO',
            reason: 'Denied',
          })
        ).status,
      ).toBe(409)
    },
  )

  it('blocks renter notes and reopening of archived resolved tickets', async () => {
    const id = await create()
    await prisma.chamadoManutencao.update({
      where: { id },
      data: { status: 'RESOLVIDO', excluidoEm: new Date() },
    })
    expect(
      (
        await action(id, env.fixture.renter.token, {
          action: 'reopen',
          status: 'ABERTO',
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
