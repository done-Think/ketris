import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { describe, expect, it } from 'vitest'
import { AddMaintenanceTicketNoteUseCase } from '../../../application/use-cases/add-maintenance-ticket-note.use-case'
import { actOnTicket } from '../../../application/workflow'
import { MaintenanceTicketNotFoundError } from '../../../domain/errors'
import {
  actor,
  admin,
  agent,
  owner,
  renter,
  repository,
  ticket,
} from '../../fixtures/maintenance-ticket'

describe('Maintenance reopening', () => {
  it('renter reopens resolved calls with a reason and preserves resolution metadata in the audit', async () => {
    const resolvedAt = new Date('2026-10-19T10:00:00Z')
    const repo = repository({
      status: 'RESOLVED',
      resolvedAt,
      completedByRole: 'AGENT',
      openedById: 'admin',
    })
    await actOnTicket(repo, renter, ticket.id, {
      action: 'reopen',
      status: 'OPEN',
      reason: '  Leak returned  ',
    })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { status: 'OPEN', resolvedAt: null, completedById: null, completedByRole: null },
      expect.objectContaining({
        authorId: 'renter',
        message: 'Leak returned',
        details: {
          before: 'RESOLVED',
          after: 'OPEN',
          reason: 'Leak returned',
          previousResolution: { resolvedAt: resolvedAt.toISOString(), completedByRole: 'AGENT' },
        },
      }),
    )
  })

  it.each([undefined, '', ' '])('requires a renter reopening reason: %s', async (reason) => {
    const repo = repository({ status: 'RESOLVED' })
    await expect(
      actOnTicket(repo, renter, ticket.id, { action: 'reopen', status: 'OPEN', reason }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(repo.mutate).not.toHaveBeenCalled()
  })

  it('does not let renters reopen directly into in-progress status', async () => {
    const repo = repository({ status: 'RESOLVED' })
    await expect(
      actOnTicket(repo, renter, ticket.id, {
        action: 'reopen',
        status: 'IN_PROGRESS',
        reason: 'Leak returned',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(repo.mutate).not.toHaveBeenCalled()
  })

  it.each([
    'OPEN',
    'IN_PROGRESS',
    'AWAITING_CONFIRMATION',
    'DISPUTED',
    'CANCELED',
    'CLOSED',
  ] as const)('denies renter reopening in %s', async (status) => {
    const repo = repository({ status })
    await expect(
      actOnTicket(repo, renter, ticket.id, {
        action: 'reopen',
        status: 'OPEN',
        reason: 'Denied',
      }),
    ).rejects.toThrow()
    expect(repo.mutate).not.toHaveBeenCalled()
  })

  it.each([actor('RENTER', 'other'), actor('RENTER', 'foreign-renter', 'other-tenant')])(
    'denies unrelated renter notes and reopening on resolved tickets',
    async (user) => {
      const repo = repository({ status: 'RESOLVED' })
      await expect(
        actOnTicket(repo, user, ticket.id, {
          action: 'reopen',
          status: 'OPEN',
          reason: 'Denied',
        }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      await expect(
        new AddMaintenanceTicketNoteUseCase(repo).execute({
          ...user,
          ticketId: ticket.id,
          message: 'Denied',
        }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
      expect(repo.addNote).not.toHaveBeenCalled()
    },
  )

  it('denies renter notes and reopening for archived or unlinked resolved tickets', async () => {
    for (const overrides of [
      { deletedAt: new Date() },
      { contractId: null, access: { ...ticket.access, validContract: false } },
    ]) {
      const repo = repository({ status: 'RESOLVED', ...overrides })
      await expect(
        actOnTicket(repo, renter, ticket.id, {
          action: 'reopen',
          status: 'OPEN',
          reason: 'Denied',
        }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      await expect(
        new AddMaintenanceTicketNoteUseCase(repo).execute({
          ...renter,
          ticketId: ticket.id,
          message: 'Denied',
        }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
      expect(repo.addNote).not.toHaveBeenCalled()
    }
  })

  it('responsible resumes contested calls and admin keeps its reopening permissions', async () => {
    await actOnTicket(
      repository({ status: 'DISPUTED', responsibleId: 'agent' }),
      agent,
      ticket.id,
      { action: 'start' },
    )
    for (const status of ['OPEN', 'IN_PROGRESS'] as const) {
      const repo = repository({ status: 'CANCELED' })
      await actOnTicket(repo, admin, ticket.id, { action: 'reopen', status })
      expect(repo.mutate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status, completedByRole: null }),
        expect.anything(),
      )
    }
    await expect(
      actOnTicket(repository({ status: 'RESOLVED' }), owner, ticket.id, {
        action: 'reopen',
        status: 'OPEN',
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })
})
