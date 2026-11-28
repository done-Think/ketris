import { afterEach, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
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

describe('resultado de evento da Agenda no banco', () => {
  it('grava status, autor, data, interesse e anotações com o histórico na mesma transação', async () => {
    const { tenantId, userId } = await fixture()
    const event = await repository.create({
      ...agendaFixtureEvent(tenantId, userId),
      type: 'VISIT',
    })

    const recorded = await repository.recordOutcome(tenantId, event.id, {
      outcome: 'COMPLETED',
      expectedStatus: 'CONFIRMED',
      visitInterest: 'HIGH',
      notes: 'Quer proposta.',
      actorUserId: userId,
    })

    expect(recorded).toMatchObject({
      status: 'COMPLETED',
      outcomeRecordedById: userId,
      outcomeRecordedByName: 'Responsável Agenda',
      visitInterest: 'HIGH',
      outcomeNotes: 'Quer proposta.',
    })
    expect(recorded?.outcomeRecordedAt).toBeInstanceOf(Date)
    const history = await prisma.agendaEventAudit.findMany({
      where: { tenantId, eventId: event.id },
      orderBy: { createdAt: 'asc' },
    })
    expect(history.map((entry) => entry.action)).toEqual(['CREATED', 'COMPLETED'])
    expect(history[1]).toMatchObject({
      actorUserId: userId,
      changedFields: ['status', 'visitInterest', 'outcomeNotes'],
    })
    const stored = await prisma.agendaEvent.findUniqueOrThrow({ where: { id: event.id } })
    expect(stored.updatedById).toBe(userId)
  })

  it('recusa o registro quando o status mudou desde a leitura, sem gravar nada', async () => {
    const { tenantId, userId } = await fixture()
    const event = await repository.create(agendaFixtureEvent(tenantId, userId))
    await repository.recordOutcome(tenantId, event.id, {
      outcome: 'NO_SHOW',
      expectedStatus: 'CONFIRMED',
      visitInterest: null,
      notes: null,
      actorUserId: userId,
    })

    await expect(
      repository.recordOutcome(tenantId, event.id, {
        outcome: 'COMPLETED',
        expectedStatus: 'CONFIRMED',
        visitInterest: null,
        notes: null,
        actorUserId: userId,
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
    expect((await prisma.agendaEvent.findUniqueOrThrow({ where: { id: event.id } })).status).toBe(
      'NO_SHOW',
    )
    expect(await prisma.agendaEventAudit.count({ where: { eventId: event.id } })).toBe(2)
  })

  it('não registra resultado em evento de outro tenant', async () => {
    const owner = await fixture()
    const other = await fixture()
    const event = await repository.create(agendaFixtureEvent(owner.tenantId, owner.userId))

    expect(
      await repository.recordOutcome(other.tenantId, event.id, {
        outcome: 'NO_SHOW',
        expectedStatus: 'CONFIRMED',
        visitInterest: null,
        notes: null,
        actorUserId: other.userId,
      }),
    ).toBeNull()
    expect((await prisma.agendaEvent.findUniqueOrThrow({ where: { id: event.id } })).status).toBe(
      'CONFIRMED',
    )
  })

  it('bloqueia edição, reagendamento e cancelamento de evento com resultado', async () => {
    const { tenantId, userId } = await fixture()
    const event = await repository.create(agendaFixtureEvent(tenantId, userId))
    await repository.recordOutcome(tenantId, event.id, {
      outcome: 'COMPLETED',
      expectedStatus: 'CONFIRMED',
      visitInterest: null,
      notes: null,
      actorUserId: userId,
    })
    const closed = expect.objectContaining({ code: 'AGENDA_EVENT_CLOSED' })

    await expect(
      repository.update(tenantId, event.id, { title: 'Outro' }, undefined, userId),
    ).rejects.toEqual(closed)
    await expect(
      repository.reschedule(
        tenantId,
        event.id,
        { start: new Date('2031-03-02T15:00:00Z'), end: new Date('2031-03-02T16:00:00Z') },
        userId,
      ),
    ).rejects.toEqual(closed)
    await expect(
      repository.cancel(tenantId, event.id, { actorUserId: userId, reason: 'Teste' }),
    ).rejects.toEqual(closed)
    expect((await prisma.agendaEvent.findUniqueOrThrow({ where: { id: event.id } })).status).toBe(
      'COMPLETED',
    )
  })
})
