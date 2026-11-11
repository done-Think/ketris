import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { describe, expect, it } from 'vitest'
import { CreateMaintenanceTicketUseCase } from '../../../application/use-cases/create-maintenance-ticket.use-case'
import { UpdateMaintenanceTicketUseCase } from '../../../application/use-cases/update-maintenance-ticket.use-case'
import { permissionsFor } from '../../../application/authorization'
import { actOnTicket, updateTicket } from '../../../application/workflow'
import { MaintenanceTicketNotFoundError } from '../../../domain/errors'
import {
  actor,
  admin,
  agent,
  contract,
  owner,
  renter,
  repository,
  ticket,
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
        type: 'EDIT',
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

  it.each([agent, admin])(
    'lets the agency team ($actorRole) schedule with a provider and audits dates',
    async (user) => {
      const repo = repository({ provider: { name: 'Selected provider' }, scheduledAt: null })
      const scheduledAt = '2026-10-24T14:00:00.000Z'
      await actOnTicket(repo, user, ticket.id, { action: 'schedule', scheduledAt })
      expect(repo.mutate).toHaveBeenCalledWith(
        expect.anything(),
        { scheduledAt: new Date(scheduledAt) },
        expect.objectContaining({
          type: 'EDIT',
          authorId: user.actorId,
          details: {
            before: { scheduledAt: null },
            after: { scheduledAt },
            provider: 'Selected provider',
          },
        }),
      )
    },
  )

  it.each([renter, owner])(
    'keeps the appointment date with the agency team when $actorRole tries to schedule',
    async (user) => {
      const repo = repository({ provider: { name: 'Selected provider' }, scheduledAt: null })
      const scheduledAt = '2026-10-24T14:00:00.000Z'
      expect(
        permissionsFor(user, { ...ticket, provider: { name: 'Selected provider' } }).schedule,
      ).toBe(false)
      await expect(
        actOnTicket(repo, user, ticket.id, { action: 'schedule', scheduledAt }),
      ).rejects.toBeInstanceOf(ForbiddenError)
      await expect(
        updateTicket(repo, user, ticket.id, { scheduledAt: new Date(scheduledAt) }),
      ).rejects.toBeInstanceOf(ForbiddenError)
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )

  it('blocks scheduling without a provider, outside the contract or on closed tickets', async () => {
    const scheduledAt = '2026-10-24T14:00:00.000Z'
    await expect(
      actOnTicket(repository(), admin, ticket.id, { action: 'schedule', scheduledAt }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      updateTicket(repository(), admin, ticket.id, { scheduledAt: new Date(scheduledAt) }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      actOnTicket(
        repository({ provider: { name: 'Provider' } }),
        actor('RENTER', 'other'),
        ticket.id,
        { action: 'schedule', scheduledAt },
      ),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    await expect(
      actOnTicket(
        repository({ status: 'RESOLVED', provider: { name: 'Provider' } }),
        admin,
        ticket.id,
        { action: 'schedule', scheduledAt },
      ),
    ).rejects.toBeInstanceOf(ConflictError)
  })
})
