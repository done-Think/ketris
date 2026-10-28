// @vitest-environment node
import type { Prisma } from '@prisma/client'
import { expect, it, vi } from 'vitest'
import { assertVisitReservation } from '../../infrastructure/agenda-visit-reservation'

function setup(conflict: { id: string } | null = null) {
  const query = vi.fn().mockResolvedValue([])
  const find = vi.fn().mockResolvedValue(conflict)
  const transaction = {
    $queryRaw: query,
    agendaEvent: { findFirst: find },
  } as unknown as Prisma.TransactionClient
  const event = {
    id: 'current',
    tenantId: 'agency',
    propertyId: 'property',
    type: 'VISIT' as const,
    start: new Date('2031-03-01T13:00:00Z'),
    end: new Date('2031-03-01T14:00:00Z'),
  }
  return { query, find, transaction, event }
}

it('locks the property before querying active visits of that same tenant and property', async () => {
  const d = setup()
  await assertVisitReservation(d.transaction, d.event)
  expect(d.query.mock.invocationCallOrder[0]).toBeLessThan(d.find.mock.invocationCallOrder[0])
  expect(d.find).toHaveBeenCalledWith({
    where: {
      tenantId: 'agency',
      propertyId: 'property',
      type: 'VISIT',
      status: { not: 'CANCELLED' },
      id: { not: 'current' },
      start: { lt: d.event.end },
      OR: [{ end: { gt: d.event.start } }, { start: { gt: new Date('2031-03-01T12:30:00Z') } }],
    },
    select: { id: true },
  })
})

it('rejects a conflicting visit from any agent', async () => {
  const d = setup({ id: 'other-agent-visit' })
  await expect(assertVisitReservation(d.transaction, d.event)).rejects.toMatchObject({
    status: 409,
  })
})

it('requires at least 30 minutes for a visit', async () => {
  const d = setup()
  await expect(
    assertVisitReservation(d.transaction, { ...d.event, end: new Date('2031-03-01T13:15:00Z') }),
  ).rejects.toMatchObject({ code: 'AGENDA_VISIT_MINIMUM_DURATION' })
  expect(d.query).not.toHaveBeenCalled()
})

it('accepts an exact 30 minute reservation', async () => {
  const d = setup()
  await expect(
    assertVisitReservation(d.transaction, { ...d.event, end: new Date('2031-03-01T13:30:00Z') }),
  ).resolves.toBeUndefined()
  expect(d.find).toHaveBeenCalled()
})

it.each(['MEETING', 'FOLLOW_UP', 'OTHER'] as const)(
  'does not apply the property rule to %s',
  async (type) => {
    const d = setup({ id: 'conflict' })
    await assertVisitReservation(d.transaction, { ...d.event, type })
    expect(d.query).not.toHaveBeenCalled()
    expect(d.find).not.toHaveBeenCalled()
  },
)

it('does not reserve cancelled visits or guess property identity from free text', async () => {
  const d = setup({ id: 'conflict' })
  await assertVisitReservation(d.transaction, { ...d.event, status: 'CANCELLED' })
  await assertVisitReservation(d.transaction, { ...d.event, propertyId: null })
  expect(d.find).not.toHaveBeenCalled()
})
