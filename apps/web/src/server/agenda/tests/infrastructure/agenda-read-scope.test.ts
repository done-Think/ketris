// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import { PrismaAgendaEventRepository } from '../../infrastructure/prisma-agenda-event.repository'
import type { AgendaReadScope } from '../../types/agenda-event'

vi.mock('@server/db/prisma', () => ({
  prisma: { agendaEvent: { findMany: vi.fn(), findFirst: vi.fn() } },
}))
const repository = new PrismaAgendaEventRepository()
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.agendaEvent.findMany).mockResolvedValue([])
  vi.mocked(prisma.agendaEvent.findFirst).mockResolvedValue(null)
})

async function filters(scope: AgendaReadScope) {
  await repository.list({ scope, from: new Date('2026-10-20'), to: new Date('2026-10-25') })
  return vi.mocked(prisma.agendaEvent.findMany).mock.calls[0][0]!.where!
}

it('limits the administrator to its tenant', async () => {
  expect(await filters({ kind: 'tenant', tenantId: 'agency' })).toMatchObject({
    AND: [{ tenantId: 'agency' }, {}],
  })
})

it('combines the agent tenant with collective, legacy and personally assigned events', async () => {
  const scope = { kind: 'agent', tenantId: 'agency', userId: 'agent' } as const
  const expected = {
    tenantId: 'agency',
    OR: [
      { audience: 'SHARED_TEAM', internal: false },
      { audience: 'ALL_AGENTS' },
      { audience: 'ASSIGNED_AGENT', responsibleId: 'agent' },
    ],
  }
  expect(await filters(scope)).toMatchObject({ AND: [expected, {}] })
  expect(await repository.findByScopeAndId(scope, 'other-agent-event')).toBeNull()
  expect(prisma.agendaEvent.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({ where: { AND: [expected, { id: 'other-agent-event' }] } }),
  )
})

it('excludes internal events for owners even with an explicit link', async () => {
  expect(await filters({ kind: 'owner', tenantId: 'agency', userId: 'owner' })).toMatchObject({
    AND: [
      {
        tenantId: 'agency',
        internal: false,
        OR: [
          { responsibleId: 'owner' },
          { createdById: 'owner' },
          { property: { ownerId: 'owner', tenantId: 'agency' } },
          { ownerUserId: 'owner' },
          { participants: { some: { userId: 'owner' } } },
        ],
      },
      {},
    ],
  })
})

it('excludes internal events for renters even with an explicit link', async () => {
  expect(await filters({ kind: 'linkedUser', userId: 'renter' })).toMatchObject({
    AND: [
      {
        internal: false,
        OR: [
          { createdById: 'renter' },
          { ownerUserId: 'renter' },
          { participants: { some: { userId: 'renter' } } },
        ],
      },
      {},
    ],
  })
})
