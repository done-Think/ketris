import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { describe, expect, it } from 'vitest'
import { permissionsFor } from '../../../application/authorization'
import { actOnTicket } from '../../../application/workflow'
import { MaintenanceTicketNotFoundError } from '../../../domain/errors'
import type { MaintenanceAction } from '../../../types/maintenance-ticket'
import {
  actor,
  admin,
  agent,
  owner,
  renter,
  repository,
  ticket,
} from '../../fixtures/maintenance-ticket'

describe('Maintenance provider', () => {
  it.each([owner])('$actorPapel cannot directly define provider', async (user) => {
    await expect(
      actOnTicket(repository(), user, ticket.id, {
        action: 'provider',
        provider: { name: 'Vendor' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it.each(['OPEN', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'DISPUTED'] as const)(
    'lets a linked renter define a provider in %s and audits previous and new values',
    async (status) => {
      const previous = { name: 'Previous provider' }
      const provider = {
        name: 'Chosen provider',
        phone: '51999990000',
        email: 'provider@example.test',
        notes: 'Plumbing',
      }
      const repo = repository({ status, openedById: 'admin', provider: previous })
      expect(permissionsFor(renter, { ...ticket, status }).provider).toBe(true)
      await actOnTicket(repo, renter, ticket.id, { action: 'provider', provider })
      expect(repo.mutate).toHaveBeenCalledWith(
        expect.anything(),
        { provider },
        expect.objectContaining({
          type: 'PROVIDER_CHANGED',
          authorId: renter.actorId,
          details: { before: previous, after: provider },
        }),
      )
    },
  )

  it.each(['RESOLVED', 'CANCELED', 'CLOSED'] as const)(
    'blocks renter provider assignment in %s',
    async (status) => {
      const repo = repository({ status })
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'provider', provider: { name: 'Denied' } }),
      ).rejects.toBeInstanceOf(ConflictError)
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )

  it.each([actor('RENTER', 'other'), actor('RENTER', 'foreign-renter', 'other-tenant')])(
    'denies unrelated renter provider assignment',
    async (user) => {
      const repo = repository()
      await expect(
        actOnTicket(repo, user, ticket.id, { action: 'provider', provider: { name: 'Denied' } }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
    },
  )

  it('blocks renter provider assignment on archived or unlinked tickets', async () => {
    for (const overrides of [
      { deletedAt: new Date() },
      { contractId: null, access: { ...ticket.access, validContract: false } },
    ]) {
      const repo = repository(overrides)
      await expect(
        actOnTicket(repo, renter, ticket.id, { action: 'provider', provider: { name: 'Denied' } }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(repo.mutate).not.toHaveBeenCalled()
    }
  })

  it('assigned agent may set a provider, owner requests and admin decides with snapshots', async () => {
    const provider = { name: 'Old' }
    const repo = repository({ responsibleId: 'agent', provider })
    await actOnTicket(repo, agent, ticket.id, { action: 'provider', provider: { name: 'New' } })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ provider: expect.objectContaining({ name: 'New' }) }),
      expect.objectContaining({ details: expect.objectContaining({ before: provider }) }),
    )
    const requestRepo = repository({ provider })
    await actOnTicket(requestRepo, owner, ticket.id, {
      action: 'requestReplacement',
      reason: 'Unreliable',
    })
    expect(requestRepo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      {},
      expect.objectContaining({ type: 'CHANGE_REQUESTED' }),
      expect.objectContaining({ kind: 'request', reason: 'Unreliable' }),
    )
    const pending = {
      id: 'request-1',
      reason: 'Unreliable',
      requestedById: 'owner',
      requestedByName: 'Owner',
      status: 'PENDING' as const,
      decisionReason: null,
      decidedByName: null,
      decidedAt: null,
      createdAt: new Date(),
    }
    const decisionRepo = repository({ provider, replacementRequests: [pending] })
    await actOnTicket(decisionRepo, admin, ticket.id, {
      action: 'approveReplacement',
      requestId: pending.id,
      provider: { name: 'New' },
    })
    expect(decisionRepo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ provider: expect.objectContaining({ name: 'New' }) }),
      expect.objectContaining({
        details: expect.objectContaining({ before: provider, approved: true }),
      }),
      expect.objectContaining({ kind: 'decision', approved: true }),
    )
    await expect(
      actOnTicket(decisionRepo, admin, ticket.id, {
        action: 'rejectReplacement',
        requestId: pending.id,
        reason: '',
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    await expect(
      actOnTicket(decisionRepo, owner, ticket.id, {
        action: 'approveReplacement',
        requestId: pending.id,
        provider: { name: 'New' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    await expect(
      actOnTicket(decisionRepo, admin, ticket.id, {
        action: 'provider',
        provider: { name: 'New' },
      }),
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('renter cannot change status or request replacement', async () => {
    const actions: MaintenanceAction[] = [
      { action: 'start' },
      { action: 'complete' },
      { action: 'confirm' },
      { action: 'contest', reason: 'No' },
      { action: 'cancel' },
      { action: 'requestReplacement', reason: 'No' },
    ]
    for (const action of actions)
      await expect(
        actOnTicket(repository({ provider: { name: 'Vendor' } }), renter, ticket.id, action),
      ).rejects.toBeInstanceOf(ForbiddenError)
  })
})
