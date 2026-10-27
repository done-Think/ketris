import { prisma } from '@server/db/prisma'
import { describe, expect, it } from 'vitest'
import { GET as listActivities } from '../../tickets/[id]/activities/route'
import { POST as addNote } from '../../tickets/[id]/notes/route'
import { GET as getTicket, PATCH } from '../../tickets/[id]/route'
import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'

describe('/api/maintenance resolution (database integration)', () => {
  const env = setupMaintenanceIntegration()
  const { request, context, create, action } = env
  it('lets only the linked renter contest a pending resolution and records the audit', async () => {
    const id = await create(env.fixture.owner.token)
    await prisma.chamadoManutencao.update({
      where: { id },
      data: { status: 'AGUARDANDO_CONFIRMACAO' },
    })
    const pending = await getTicket(
      request(`tickets/${id}`, 'GET', env.fixture.renter.token),
      context(id),
    )
    expect((await pending.json()).ticket.permissions).toMatchObject({
      contest: true,
      confirm: false,
    })
    for (const user of [env.fixture.unrelated, env.other.renter]) {
      expect((await action(id, user.token, { action: 'contest', reason: 'Denied' })).status).toBe(
        404,
      )
    }
    expect(
      (await action(id, env.fixture.renter.token, { action: 'contest', reason: ' ' })).status,
    ).toBe(400)
    expect((await action(id, env.fixture.renter.token, { action: 'confirm' })).status).toBe(403)
    const response = await action(id, env.fixture.renter.token, {
      action: 'contest',
      reason: 'Still leaking',
    })
    expect(response.status).toBe(200)
    expect((await response.json()).ticket).toMatchObject({ status: 'CONTESTADO', resolvedAt: null })
    const history = await listActivities(
      request(`tickets/${id}/activities`, 'GET', env.fixture.renter.token),
      context(id),
    )
    expect((await history.json()).activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'MUDANCA_STATUS',
          authorId: env.fixture.renter.id,
          message: 'Still leaking',
          details: { before: 'AGUARDANDO_CONFIRMACAO', after: 'CONTESTADO' },
        }),
      ]),
    )
    expect(
      (await action(id, env.fixture.renter.token, { action: 'contest', reason: 'Again' })).status,
    ).toBe(403)
  })

  it.each(['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'rejects renter contestation in %s',
    async (status) => {
      const id = await create()
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      expect(
        (await action(id, env.fixture.renter.token, { action: 'contest', reason: 'Denied' }))
          .status,
      ).toBe(['RESOLVIDO', 'CANCELADO', 'FECHADO'].includes(status) ? 409 : 403)
    },
  )

  it('rejects renter contestation of archived tickets', async () => {
    const id = await create()
    await prisma.chamadoManutencao.update({
      where: { id },
      data: { status: 'AGUARDANDO_CONFIRMACAO', excluidoEm: new Date() },
    })
    expect(
      (await action(id, env.fixture.renter.token, { action: 'contest', reason: 'Denied' })).status,
    ).toBe(404)
  })

  it.each(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CONFIRMACAO', 'CONTESTADO'] as const)(
    'lets the linked renter finish %s directly and preserves the ticket history and original data',
    async (status) => {
      const id = await create(env.fixture.admin.token)
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      const before = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
      const detail = await getTicket(
        request(`tickets/${id}`, 'GET', env.fixture.renter.token),
        context(id),
      )
      expect((await detail.json()).ticket.permissions).toMatchObject({
        finish: true,
        edit: false,
        delete: false,
      })
      for (const user of [env.fixture.unrelated, env.other.renter]) {
        expect((await action(id, user.token, { action: 'finish' })).status).toBe(404)
      }
      for (const user of [env.fixture.admin, env.fixture.agent, env.fixture.owner]) {
        expect((await action(id, user.token, { action: 'finish' })).status).toBe(403)
      }
      expect(
        (
          await action(id, env.fixture.renter.token, {
            action: 'finish',
            title: 'Overwrite',
            description: 'Overwrite',
          })
        ).status,
      ).toBe(400)
      const response = await action(id, env.fixture.renter.token, { action: 'finish' })
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.ticket).toMatchObject({
        status: 'RESOLVIDO',
        title: before.titulo,
        description: before.descricao,
        propertyId: before.imovelId,
        contractId: before.contratoId,
        category: before.categoria,
        priority: before.prioridade,
        permissions: {
          finish: false,
          edit: false,
          delete: false,
          comment: true,
          reopen: true,
          collaborate: false,
        },
      })
      expect(body.ticket.resolvedAt).toEqual(expect.any(String))
      expect(body.ticket.activities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Chamado aberto.' }),
          expect.objectContaining({
            type: 'MUDANCA_STATUS',
            authorId: env.fixture.renter.id,
            details: {
              before: status,
              after: 'RESOLVIDO',
              resolvedAt: body.ticket.resolvedAt,
              previousCompletionRole: null,
            },
          }),
        ]),
      )
      const stored = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
      expect(stored).toMatchObject({
        concluidoPorId: env.fixture.renter.id,
        concluidoPorPapel: 'RENTER',
        resolvidoEm: new Date(body.ticket.resolvedAt),
      })
      expect((await action(id, env.fixture.renter.token, { action: 'finish' })).status).toBe(409)
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
          await action(id, env.fixture.renter.token, {
            action: 'reopen',
            status: 'ABERTO',
            reason: 'Problem returned',
          })
        ).status,
      ).toBe(200)
      expect((await action(id, env.fixture.renter.token, { action: 'finish' })).status).toBe(200)
    },
  )

  it.each(['RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'blocks renter finalization of %s tickets',
    async (status) => {
      const id = await create()
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      expect((await action(id, env.fixture.renter.token, { action: 'finish' })).status).toBe(409)
    },
  )

  it('blocks renter finalization of archived and legacy tickets', async () => {
    const archived = await create()
    await prisma.chamadoManutencao.update({
      where: { id: archived },
      data: { excluidoEm: new Date() },
    })
    expect((await action(archived, env.fixture.renter.token, { action: 'finish' })).status).toBe(
      404,
    )
    const legacy = await create()
    await prisma.chamadoManutencao.update({ where: { id: legacy }, data: { contratoId: null } })
    expect((await action(legacy, env.fixture.renter.token, { action: 'finish' })).status).toBe(404)
  })

  it('requires assigned agent, contests and confirms resolution, then locks writes', async () => {
    const id = await create()
    expect((await action(id, env.fixture.agent.token, { action: 'start' })).status).toBe(403)
    expect((await action(id, env.fixture.agent.token, { action: 'assume' })).status).toBe(200)
    expect((await action(id, env.fixture.owner.token, { action: 'assume' })).status).toBe(403)
    expect((await action(id, env.fixture.agent.token, { action: 'start' })).status).toBe(200)
    expect((await action(id, env.fixture.agent.token, { action: 'complete' })).status).toBe(200)
    expect(
      (await action(id, env.fixture.owner.token, { action: 'contest', reason: 'Still leaking' }))
        .status,
    ).toBe(200)
    expect((await action(id, env.fixture.agent.token, { action: 'start' })).status).toBe(200)
    expect((await action(id, env.fixture.agent.token, { action: 'complete' })).status).toBe(200)
    const resolved = await action(id, env.fixture.owner.token, { action: 'confirm' })
    expect(resolved.status).toBe(200)
    expect((await resolved.json()).ticket.status).toBe('RESOLVIDO')
    expect(
      (
        await addNote(
          request(`tickets/${id}/notes`, 'POST', env.fixture.admin.token, { message: 'Denied' }),
          context(id),
        )
      ).status,
    ).toBe(409)
    expect(
      (await action(id, env.fixture.admin.token, { action: 'reopen', status: 'EM_ANDAMENTO' }))
        .status,
    ).toBe(200)
  })

  it('prevents owner self-confirmation and requires admin validation', async () => {
    const id = await create()
    await action(id, env.fixture.owner.token, { action: 'assume' })
    await action(id, env.fixture.owner.token, { action: 'start' })
    await action(id, env.fixture.owner.token, { action: 'complete' })
    expect((await action(id, env.fixture.owner.token, { action: 'confirm' })).status).toBe(403)
    expect((await action(id, env.fixture.admin.token, { action: 'confirm' })).status).toBe(200)
  })
})
