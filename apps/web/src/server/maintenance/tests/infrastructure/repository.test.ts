// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import {
  PrismaMaintenanceTicketRepository,
  maintenanceTicketScope,
} from '../../infrastructure/prisma-maintenance-ticket.repository'
import type { MaintenanceActor, MaintenanceTicket } from '../../types/maintenance-ticket'
import { ConflictError } from '@server/shared/errors'

vi.mock('@server/db/prisma', () => ({ prisma: { $transaction: vi.fn() } }))
const actor: MaintenanceActor = {
  actorId: 'renter',
  actorTenantId: 'tenant',
  actorPapel: 'RENTER',
  actorName: 'Renter',
}
const unusedContractPartyLinker = () => ({ execute: vi.fn() })
describe('Maintenance repository boundary and atomic writes', () => {
  beforeEach(() => vi.clearAllMocks())
  it('scopes renter lists and counts through explicit contract party ID', () => {
    expect(maintenanceTicketScope(actor)).toEqual({
      excluidoEm: null,
      contrato: {
        is: {
          partes: {
            some: {
              papel: 'LOCATARIO',
              usuarioId: 'renter',
              usuario: { ativo: true, papel: 'RENTER' },
            },
          },
        },
      },
    })
  })
  it('scopes agent and owner through assignment OR property relationship, always with contract and tenant', () => {
    for (const role of ['AGENT', 'PROPERTY_OWNER'] as const) {
      const scope = maintenanceTicketScope({ ...actor, actorPapel: role })
      expect(scope.tenantId).toBe('tenant')
      expect(scope.contrato).toEqual({ is: { tenantId: 'tenant' } })
      expect(scope.OR).toContainEqual({ responsavelId: 'renter' })
      expect(scope.excluidoEm).toBeNull()
    }
    expect(maintenanceTicketScope({ ...actor, actorPapel: 'OWNER' })).toEqual({
      tenantId: 'tenant',
    })
  })
  it('refuses stale mutations before writing audit or deciding requests', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 })
    const create = vi.fn()
    const transaction = {
      chamadoManutencao: { updateMany },
      atividadeChamadoManutencao: { create },
      solicitacaoTrocaPrestador: { create },
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
    const repository = new PrismaMaintenanceTicketRepository(unusedContractPartyLinker)
    await expect(
      repository.mutate(
        ticket,
        { responsibleId: 'agent' },
        {
          type: 'RESPONSAVEL_ALTERADO',
          message: 'Assigned',
          authorId: 'admin',
          authorName: 'Admin',
        },
      ),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ticket', tenantId: 'tenant', updatedAt: ticket.updatedAt, excluidoEm: null },
      }),
    )
    expect(create).not.toHaveBeenCalled()
  })
  it('does not write an approval audit if the pending request was already decided', async () => {
    const create = vi.fn()
    const transaction = {
      chamadoManutencao: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      atividadeChamadoManutencao: { create },
      solicitacaoTrocaPrestador: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
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
      new PrismaMaintenanceTicketRepository(unusedContractPartyLinker).mutate(
        ticket,
        { provider: { name: 'New' } },
        { type: 'TROCA_DECIDIDA', message: 'Approved', authorId: 'admin', authorName: 'Admin' },
        { kind: 'decision', actor, requestId: 'request', approved: true },
      ),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(create).not.toHaveBeenCalled()
  })
})
