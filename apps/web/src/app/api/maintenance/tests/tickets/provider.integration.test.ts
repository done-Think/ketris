import { prisma } from '@server/db/prisma'
import { describe, expect, it } from 'vitest'
import { setupMaintenanceIntegration } from '../fixtures/maintenance-api'

describe('/api/maintenance provider (database integration)', () => {
  const env = setupMaintenanceIntegration()
  const { create, action } = env
  it.each(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CONFIRMACAO', 'CONTESTADO'] as const)(
    'lets the linked renter define a provider in %s and preserves original data and history',
    async (status) => {
      const id = await create(env.fixture.admin.token)
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
      const before = await prisma.chamadoManutencao.findUniqueOrThrow({ where: { id } })
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
        title: before.titulo,
        description: before.descricao,
        contractId: before.contratoId,
        propertyId: before.imovelId,
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
            type: 'PRESTADOR_ALTERADO',
            authorId: env.fixture.renter.id,
            details: { before: null, after: { ...provider, id: body.ticket.provider.id } },
          }),
          expect.objectContaining({
            type: 'PRESTADOR_ALTERADO',
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

  it.each(['RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'blocks renter provider changes in %s',
    async (status) => {
      const id = await create()
      await prisma.chamadoManutencao.update({ where: { id }, data: { status } })
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
    await prisma.chamadoManutencao.update({
      where: { id: archived },
      data: { excluidoEm: new Date() },
    })
    const legacy = await create()
    await prisma.chamadoManutencao.update({ where: { id: legacy }, data: { contratoId: null } })
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
    const row = await prisma.chamadoManutencao.findUniqueOrThrow({
      where: { id },
      include: { atividades: true, solicitacoesTroca: true },
    })
    expect(row.prestadorNome).toBe('New vendor')
    expect(row.solicitacoesTroca[0].status).toBe('APROVADA')
    expect(row.atividades.find((a) => a.tipo === 'TROCA_DECIDIDA')?.detalhes).toMatchObject({
      before: { name: 'Old vendor' },
      after: { name: 'New vendor' },
    })
  })
})
