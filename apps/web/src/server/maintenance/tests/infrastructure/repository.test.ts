// @vitest-environment node
import { prisma } from '@server/db/prisma'
import { ConflictError } from '@server/shared/errors'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PrismaMaintenanceTicketRepository,
  maintenanceTicketScope,
} from '../../infrastructure/prisma-maintenance-ticket.repository'
import type { MaintenanceActor, MaintenanceTicket } from '../../types/maintenance-ticket'

vi.mock('@server/db/prisma', () => ({ prisma: { $transaction: vi.fn() } }))
const actor: MaintenanceActor = {
  actorId: 'renter',
  actorTenantId: 'tenant',
  actorRole: 'RENTER',
  actorName: 'Renter',
}
describe('Maintenance repository boundary and atomic writes', () => {
  beforeEach(() => vi.clearAllMocks())
  it('scopes renter lists and counts through explicit contract party ID', () => {
    expect(maintenanceTicketScope(actor)).toEqual({
      deletedAt: null,
      contract: {
        is: {
          parties: {
            some: {
              role: 'RENTER',
              userId: 'renter',
              user: { active: true, role: 'RENTER' },
            },
          },
        },
      },
    })
  })
  it('scopes agent and owner through assignment OR property relationship, always with contract and tenant', () => {
    for (const role of ['AGENT', 'PROPERTY_OWNER'] as const) {
      const scope = maintenanceTicketScope({ ...actor, actorRole: role })
      expect(scope.tenantId).toBe('tenant')
      expect(scope.contract).toEqual({ is: { tenantId: 'tenant' } })
      expect(scope.OR).toContainEqual({ responsibleId: 'renter' })
      expect(scope.deletedAt).toBeNull()
    }
    expect(maintenanceTicketScope({ ...actor, actorRole: 'OWNER' })).toEqual({
      tenantId: 'tenant',
    })
  })
  it('refuses stale mutations before writing audit or deciding requests', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 })
    const create = vi.fn()
    const transaction = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'admin', tenantId: 'tenant', role: 'OWNER' }),
      },
      maintenanceTicket: { updateMany },
      maintenanceTicketActivity: { create },
      providerChangeRequest: { create },
    }
    vi.mocked(prisma.$transaction).mockImplementation(
      async (callback) =>
        (callback as unknown as (tx: unknown) => Promise<unknown>)(transaction) as never,
    )
    const ticket = {
      id: 'ticket',
      tenantId: 'tenant',
      deletedAt: null,
      updatedAt: new Date('2026-10-14T00:00:00Z'),
    } as MaintenanceTicket
    const repository = new PrismaMaintenanceTicketRepository()
    await expect(
      repository.mutate(
        ticket,
        { responsibleId: 'agent' },
        {
          type: 'RESPONSIBLE_CHANGED',
          message: 'Assigned',
          authorId: 'admin',
          authorName: 'Admin',
        },
      ),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ticket', tenantId: 'tenant', updatedAt: ticket.updatedAt, deletedAt: null },
      }),
    )
    expect(create).not.toHaveBeenCalled()
  })
  it('does not write an approval audit if the pending request was already decided', async () => {
    const create = vi.fn()
    const transaction = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'admin', tenantId: 'tenant', role: 'OWNER' }),
      },
      maintenanceTicket: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      maintenanceTicketActivity: { create },
      providerChangeRequest: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    }
    vi.mocked(prisma.$transaction).mockImplementation(
      async (callback) =>
        (callback as unknown as (tx: unknown) => Promise<unknown>)(transaction) as never,
    )
    const ticket = {
      id: 'ticket',
      tenantId: 'tenant',
      deletedAt: null,
      updatedAt: new Date(),
    } as MaintenanceTicket
    await expect(
      new PrismaMaintenanceTicketRepository().mutate(
        ticket,
        { provider: { name: 'New' } },
        { type: 'CHANGE_DECIDED', message: 'Approved', authorId: 'admin', authorName: 'Admin' },
        { kind: 'decision', actor, requestId: 'request', approved: true },
      ),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(create).not.toHaveBeenCalled()
  })
})
