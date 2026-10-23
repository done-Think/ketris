import { describe, expect, it } from 'vitest'
import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { MaintenanceTicketNotFoundError } from '../../../domain/errors'
import { actOnTicket } from '../../../application/workflow'
import { permissionsFor } from '../../../application/authorization'
import {
  actor,
  admin,
  agent,
  owner,
  renter,
  ticket,
  repository,
} from '../../fixtures/maintenance-ticket'

describe('Maintenance resolution', () => {
  it.each(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CONFIRMACAO', 'CONTESTADO'] as const)(
    'lets a linked renter finish %s directly with audit and no assignment',
    async (status) => {
      const repo = repository({ status, openedById: 'admin', responsibleId: null, provider: null })
      expect(permissionsFor(renter, { ...ticket, status })).toMatchObject({
        finish: true,
        edit: false,
        delete: false,
        confirm: false,
      })
      await actOnTicket(repo, renter, ticket.id, { action: 'finish' })
      expect(repo.mutate).toHaveBeenCalledWith(
        expect.anything(),
        {
          status: 'RESOLVIDO',
          resolvedAt: expect.any(Date),
          completedByRole: 'RENTER',
          completedById: renter.actorId,
        },
        expect.objectContaining({
          type: 'MUDANCA_STATUS',
          authorId: renter.actorId,
          details: {
            before: status,
            after: 'RESOLVIDO',
            resolvedAt: expect.any(String),
            previousCompletionRole: null,
          },
        }),
      )
    },
  )

  it.each(['RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'blocks renter finalization in %s',
    async (status) => {
      const repo = repository({ status })
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'finish' }),
      ).rejects.toBeInstanceOf(ConflictError)
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )

  it.each([actor('RENTER', 'other'), actor('RENTER', 'foreign-renter', 'other-tenant')])(
    'blocks unrelated renter finalization',
    async (user) => {
      const repo = repository()
      await expect(actOnTicket(repo, user, ticket.id, { action: 'finish' })).rejects.toBeInstanceOf(
        MaintenanceTicketNotFoundError,
      )
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )

  it('blocks finalization of archived or unlinked tickets', async () => {
    for (const overrides of [
      { deletedAt: new Date() },
      { contractId: null, access: { ...ticket.access, validContract: false } },
    ]) {
      const repo = repository(overrides)
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'finish' }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
    }
  })

  it.each([admin, agent, owner])(
    'keeps $actorPapel on the existing completion workflow',
    async (user) => {
      const repo = repository({ responsibleId: user.actorId, status: 'EM_ANDAMENTO' })
      await expect(actOnTicket(repo, user, ticket.id, { action: 'finish' })).rejects.toBeInstanceOf(
        ForbiddenError,
      )
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )

  it('linked agent must be assigned to start or complete', async () => {
    await expect(
      actOnTicket(repository(), agent, ticket.id, { action: 'start' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      actOnTicket(repository({ status: 'EM_ANDAMENTO' }), agent, ticket.id, { action: 'complete' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    const repo = repository({ responsibleId: 'agent', status: 'EM_ANDAMENTO' })
    await actOnTicket(repo, agent, ticket.id, { action: 'complete' })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: 'AGUARDANDO_CONFIRMACAO', completedByRole: 'AGENT' }),
      expect.objectContaining({
        details: { before: 'EM_ANDAMENTO', after: 'AGUARDANDO_CONFIRMACAO' },
      }),
    )
  })

  it('owner cannot confirm an owner-completed repair', async () => {
    await expect(
      actOnTicket(
        repository({ status: 'AGUARDANDO_CONFIRMACAO', completedByRole: 'OWNER' }),
        owner,
        ticket.id,
        { action: 'confirm' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError)
    const repo = repository({ status: 'AGUARDANDO_CONFIRMACAO', completedByRole: 'OWNER' })
    await actOnTicket(repo, admin, ticket.id, { action: 'confirm' })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { status: 'RESOLVIDO', resolvedAt: expect.any(Date) },
      expect.anything(),
    )
  })

  it('owner can confirm agent repair and contest with mandatory reason', async () => {
    const pending = { status: 'AGUARDANDO_CONFIRMACAO' as const, completedByRole: 'AGENT' as const }
    await actOnTicket(repository(pending), owner, ticket.id, { action: 'confirm' })
    await expect(
      actOnTicket(repository(pending), owner, ticket.id, { action: 'contest', reason: ' ' }),
    ).rejects.toBeInstanceOf(ConflictError)
    const repo = repository(pending)
    await actOnTicket(repo, owner, ticket.id, { action: 'contest', reason: 'Still leaking' })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { status: 'CONTESTADO', resolvedAt: null },
      expect.objectContaining({ message: 'Still leaking', authorId: 'owner' }),
    )
  })

  it('linked renter contests a pending resolution with an audited reason even when opened by someone else', async () => {
    const repo = repository({ status: 'AGUARDANDO_CONFIRMACAO', openedById: 'owner' })
    const pending = await repo.findById(admin, ticket.id)
    expect(permissionsFor(renter, pending!)).toMatchObject({ contest: true, confirm: false })
    await actOnTicket(repo, renter, ticket.id, { action: 'contest', reason: 'Still leaking' })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { status: 'CONTESTADO', resolvedAt: null },
      expect.objectContaining({
        authorId: 'renter',
        message: 'Still leaking',
        details: { before: 'AGUARDANDO_CONFIRMACAO', after: 'CONTESTADO' },
      }),
    )
  })

  it('requires a reason and still denies renter confirmation while pending', async () => {
    const repo = repository({ status: 'AGUARDANDO_CONFIRMACAO' })
    await expect(
      actOnTicket(repo, renter, ticket.id, { action: 'contest', reason: ' ' }),
    ).rejects.toBeInstanceOf(ConflictError)
    await expect(
      actOnTicket(repo, renter, ticket.id, { action: 'confirm' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(repo.mutate).not.toHaveBeenCalled()
  })

  it.each(['ABERTO', 'EM_ANDAMENTO', 'CONTESTADO', 'RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'blocks renter contestation in %s',
    async (status) => {
      const repo = repository({ status })
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'contest', reason: 'Still leaking' }),
      ).rejects.toThrow()
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )

  it.each([actor('RENTER', 'other'), actor('RENTER', 'foreign-renter', 'other-tenant')])(
    'blocks contestation by unrelated renters',
    async (user) => {
      const repo = repository({ status: 'AGUARDANDO_CONFIRMACAO' })
      await expect(
        actOnTicket(repo, user, ticket.id, { action: 'contest', reason: 'Denied' }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )

  it('blocks renter contestation of archived or unlinked tickets', async () => {
    for (const overrides of [
      { deletedAt: new Date() },
      { contractId: null, access: { ...ticket.access, validContract: false } },
    ]) {
      const repo = repository({ status: 'AGUARDANDO_CONFIRMACAO', ...overrides })
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'contest', reason: 'Denied' }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
    }
  })
})
