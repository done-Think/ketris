import { describe, expect, it } from 'vitest'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { MaintenanceTicketNotFoundError } from '../../../domain/errors'
import { CreateMaintenanceTicketUseCase } from '../../../application/use-cases/create-maintenance-ticket.use-case'
import { UpdateMaintenanceTicketUseCase } from '../../../application/use-cases/update-maintenance-ticket.use-case'
import { actOnTicket, updateTicket } from '../../../application/workflow'
import {
  actor,
  admin,
  renter,
  contract,
  ticket,
  repository,
} from '../../fixtures/maintenance-ticket'

describe('Maintenance scheduling', () => {
  it('persists optional appointments and audits staff rescheduling without granting renter editing', async () => {
    const scheduledAt = new Date('2026-10-24T14:00:00Z')
    const repo = repository({ scheduledAt: null, provider: { name: 'Provider' } })
    await expect(
      new CreateMaintenanceTicketUseCase(repo).execute({
        ...renter,
        contractId: contract.id,
        title: 'Leak',
        category: 'PLUMBING',
        description: 'Leak',
        priority: 'NORMAL',
        scheduledAt,
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(repo.create).not.toHaveBeenCalled()
    const update = new UpdateMaintenanceTicketUseCase(repo)
    await update.execute({ ...admin, ticketId: ticket.id, scheduledAt })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ scheduledAt }),
      expect.objectContaining({
        type: 'EDICAO',
        details: { before: { scheduledAt: null }, after: { scheduledAt } },
      }),
    )
    await expect(
      update.execute({ ...renter, ticketId: ticket.id, scheduledAt }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await update.execute({ ...admin, ticketId: ticket.id, scheduledAt: null })
    expect(repo.mutate).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ scheduledAt: null }),
      expect.anything(),
    )
  })

  it('allows linked renters to schedule with a provider and audits dates without changing ticket fields', async () => {
    const repo = repository({ provider: { name: 'Selected provider' }, scheduledAt: null })
    const scheduledAt = '2026-10-24T14:00:00.000Z'
    await actOnTicket(repo, renter, ticket.id, { action: 'schedule', scheduledAt })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { scheduledAt: new Date(scheduledAt) },
      expect.objectContaining({
        type: 'EDICAO',
        authorId: renter.actorId,
        details: {
          before: { scheduledAt: null },
          after: { scheduledAt },
          provider: 'Selected provider',
        },
      }),
    )
    await expect(
      actOnTicket(repository(), renter, ticket.id, { action: 'schedule', scheduledAt }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      updateTicket(repository(), admin, ticket.id, { scheduledAt: new Date(scheduledAt) }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      actOnTicket(repo, actor('RENTER', 'other'), ticket.id, { action: 'schedule', scheduledAt }),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    await expect(
      actOnTicket(
        repository({ status: 'RESOLVIDO', provider: { name: 'Provider' } }),
        renter,
        ticket.id,
        { action: 'schedule', scheduledAt },
      ),
    ).rejects.toBeInstanceOf(ConflictError)
  })
})
