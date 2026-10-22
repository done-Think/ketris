import { describe, expect, it, vi } from 'vitest'
import { ForbiddenError } from '@server/shared/errors'
import { MaintenancePropertyNotFoundError } from '../../../domain/errors'
import { actOnTicket, deleteTicket } from '../../../application/workflow'
import { canAccessTicket, permissionsFor } from '../../../application/authorization'
import {
  admin,
  agent,
  owner,
  renter,
  contract,
  ticket,
  repository,
} from '../../fixtures/maintenance-ticket'

describe('Maintenance regularization', () => {
  it.each(['ABERTO', 'RESOLVIDO', 'CANCELADO', 'FECHADO'] as const)(
    'admin links legacy %s calls without changing their lifecycle, including archived calls',
    async (status) => {
      for (const deletedAt of [null, new Date('2026-10-01')]) {
        const repo = repository({ status, deletedAt, contractId: null })
        await actOnTicket(repo, admin, ticket.id, {
          action: 'linkContract',
          contractId: contract.id,
        })
        expect(repo.findById).toHaveBeenCalledWith(admin, ticket.id)
        expect(repo.mutate).toHaveBeenCalledWith(
          expect.anything(),
          { contractId: contract.id },
          expect.objectContaining({
            type: 'EDICAO',
            authorId: admin.actorId,
            details: {
              before: { contractId: null, propertyId: ticket.propertyId },
              after: { contractId: contract.id, propertyId: ticket.propertyId },
            },
          }),
        )
      }
    },
  )

  it.each([agent, owner, renter])('denies contract linking by $actorPapel', async (user) => {
    const repo = repository()
    expect(permissionsFor(user, ticket).linkContract).toBe(false)
    await expect(
      actOnTicket(repo, user, ticket.id, { action: 'linkContract', contractId: contract.id }),
    ).rejects.toBeInstanceOf(ForbiddenError)
    expect(repo.mutate).not.toHaveBeenCalled()
  })

  it('rejects missing contracts and contracts from another property during regularization', async () => {
    for (const value of [null, { ...contract, propertyId: 'another-property' }]) {
      const repo = repository({}, { findContract: vi.fn().mockResolvedValue(value) })
      await expect(
        actOnTicket(repo, admin, ticket.id, { action: 'linkContract', contractId: contract.id }),
      ).rejects.toBeInstanceOf(MaintenancePropertyNotFoundError)
      expect(repo.findContract).toHaveBeenCalledWith(admin, contract.id)
      expect(repo.mutate).not.toHaveBeenCalled()
    }
  })

  it.each([agent, owner])('allows $actorPapel to assume only unassigned calls', async (user) => {
    const repo = repository()
    await actOnTicket(repo, user, ticket.id, { action: 'assume' })
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { responsibleId: user.actorId },
      expect.objectContaining({ type: 'RESPONSAVEL_ALTERADO', authorId: user.actorId }),
    )
    await expect(
      actOnTicket(repository({ responsibleId: 'other' }), user, ticket.id, { action: 'assume' }),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it.each([agent, owner, renter])(
    'only admin can assign or delete, denies $actorPapel',
    async (user) => {
      await expect(
        actOnTicket(repository(), user, ticket.id, { action: 'assign', responsibleId: 'agent' }),
      ).rejects.toBeInstanceOf(ForbiddenError)
      await expect(deleteTicket(repository(), user, ticket.id)).rejects.toBeInstanceOf(
        ForbiddenError,
      )
    },
  )

  it('refuses renter or foreign users as responsible', async () => {
    for (const value of [null, { id: 'renter', role: 'RENTER' }]) {
      const repo = repository({}, { findUser: vi.fn().mockResolvedValue(value) })
      await expect(
        actOnTicket(repo, admin, ticket.id, { action: 'assign', responsibleId: 'invalid' }),
      ).rejects.toBeInstanceOf(ForbiddenError)
    }
  })

  it('soft deletes without changing status and restores without removing history', async () => {
    const repo = repository({ status: 'EM_ANDAMENTO' })
    await deleteTicket(repo, admin, ticket.id)
    expect(repo.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { deletedAt: expect.any(Date), deletedById: 'admin' },
      expect.objectContaining({ type: 'EXCLUSAO' }),
    )
    const archived = repository({ status: 'EM_ANDAMENTO', deletedAt: new Date() })
    await actOnTicket(archived, admin, ticket.id, { action: 'restore' })
    expect(archived.mutate).toHaveBeenCalledWith(
      expect.anything(),
      { deletedAt: null, deletedById: null },
      expect.objectContaining({ type: 'RESTAURACAO' }),
    )
    expect(canAccessTicket(renter, { ...ticket, deletedAt: new Date() })).toBe(false)
  })
})
