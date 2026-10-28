import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { PrismaUserRepository } from '@server/auth/infrastructure/prisma-user.repository'
import { PrismaAgendaEventRepository } from '../../infrastructure/prisma-agenda-event.repository'
import { createAgendaFixture, agendaFixtureEvent } from '../fixtures/agenda-database'

const tenants: string[] = []
const repository = new PrismaAgendaEventRepository()
async function fixture() {
  const data = await createAgendaFixture()
  tenants.push(data.tenantId)
  return data
}
afterEach(async () => {
  for (const id of tenants.splice(0)) await prisma.tenant.delete({ where: { id } })
})

describe('histórico transacional de Agenda', () => {
  it('registra as quatro operações, com tenant, autor e motivo do cancelamento', async () => {
    const { tenantId, userId } = await fixture()
    const event = await repository.create(agendaFixtureEvent(tenantId, userId))
    await repository.update(tenantId, event.id, { title: 'Novo título' }, undefined, userId)
    await repository.reschedule(
      tenantId,
      event.id,
      { start: new Date('2031-03-02T15:00:00Z'), end: new Date('2031-03-02T16:00:00Z') },
      userId,
    )
    await repository.cancel(tenantId, event.id, {
      actorUserId: userId,
      reason: 'Cliente indisponível',
    })
    const history = await prisma.agendaEventAudit.findMany({
      where: { tenantId, eventId: event.id },
      orderBy: { createdAt: 'asc' },
    })
    expect(history.map((entry) => entry.action)).toEqual([
      'CREATED',
      'UPDATED',
      'RESCHEDULED',
      'CANCELLED',
    ])
    expect(history.every((entry) => entry.actorUserId === userId)).toBe(true)
    expect(history[1].changedFields).toEqual(['title'])
    expect(history[3].cancellationReason).toBe('Cliente indisponível')
    const stored = await prisma.agendaEvent.findUniqueOrThrow({ where: { id: event.id } })
    expect(stored).toMatchObject({
      status: 'CANCELLED',
      canceledById: userId,
      cancellationReason: 'Cliente indisponível',
    })
    expect(stored.canceledAt).toBeInstanceOf(Date)
  })

  it('reverte a edição quando o histórico não pode registrar o autor', async () => {
    const { tenantId, userId } = await fixture()
    const event = await repository.create(agendaFixtureEvent(tenantId, userId))
    await expect(
      repository.update(
        tenantId,
        event.id,
        { title: 'Não deve persistir' },
        undefined,
        'missing-author',
      ),
    ).rejects.toMatchObject({ code: 'P2003' })
    expect((await prisma.agendaEvent.findUniqueOrThrow({ where: { id: event.id } })).title).toBe(
      'Reunião de teste',
    )
    expect(await prisma.agendaEventAudit.count({ where: { eventId: event.id } })).toBe(1)
  })

  it('reverte o cancelamento se a auditoria falhar e não grava eventos em outro tenant', async () => {
    const { tenantId, userId } = await fixture()
    const event = await repository.create(agendaFixtureEvent(tenantId, userId))
    await expect(
      repository.cancel(tenantId, event.id, {
        actorUserId: 'missing-author',
        reason: 'Não deve persistir',
      }),
    ).rejects.toMatchObject({ code: 'P2003' })
    expect((await prisma.agendaEvent.findUniqueOrThrow({ where: { id: event.id } })).status).toBe(
      'CONFIRMED',
    )
    const other = await fixture()
    expect(
      await repository.update(
        other.tenantId,
        event.id,
        { title: 'Outro tenant' },
        undefined,
        other.userId,
      ),
    ).toBeNull()
    expect(await prisma.agendaEventAudit.count({ where: { tenantId: other.tenantId } })).toBe(0)
  })

  it('bloqueia exclusão física do responsável e preserva inativação e eventos', async () => {
    const { tenantId, userId } = await fixture()
    const event = await repository.create(agendaFixtureEvent(tenantId, userId))
    await expect(prisma.user.delete({ where: { id: userId } })).rejects.toMatchObject({
      code: 'P2003',
    })
    await new PrismaUserRepository().deactivate(userId, tenantId, { kind: 'USER', id: userId })
    expect(await prisma.agendaEvent.count({ where: { id: event.id } })).toBe(1)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).active).toBe(false)
  })
})

it('prioriza o vínculo da conta no tenant mesmo quando há um locatário com o mesmo e-mail em outro tenant', async () => {
  const local = await fixture(),
    foreign = await fixture()
  const manager = await prisma.user.findUniqueOrThrow({ where: { id: local.userId } })
  const renter = await prisma.user.create({
    data: {
      tenantId: foreign.tenantId,
      name: 'Outra conta da pessoa',
      email: manager.email,
      passwordHash: 'test-only',
      role: 'RENTER',
    },
  })
  const event = await repository.create(agendaFixtureEvent(local.tenantId, local.userId), {
    ownerEmail: manager.email,
  })
  expect(event.ownerUserId).toBe(local.userId)
  expect(event.ownerUserId).not.toBe(renter.id)
})

it('registra o autor real quando ele difere do responsável pelo evento', async () => {
  const { tenantId, userId } = await fixture()
  const responsible = await prisma.user.create({
    data: {
      tenantId,
      name: 'Outra responsável',
      email: `responsible-${userId}@example.test`,
      passwordHash: 'test-only',
      role: 'AGENT',
    },
  })
  const event = await repository.create({
    ...agendaFixtureEvent(tenantId, userId),
    responsibleId: responsible.id,
  })
  await repository.update(tenantId, event.id, { title: 'Editado pela gestão' }, undefined, userId)
  const history = await prisma.agendaEventAudit.findMany({ where: { eventId: event.id } })
  expect(history).toHaveLength(2)
  expect(
    history.every((entry) => entry.actorUserId === userId && entry.actorUserId !== responsible.id),
  ).toBe(true)
})
