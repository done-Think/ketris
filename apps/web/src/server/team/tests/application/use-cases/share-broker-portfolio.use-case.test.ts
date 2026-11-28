import { describe, expect, it, vi } from 'vitest'
import { ShareBrokerPortfolioUseCase } from '../../../application/use-cases/manage-broker-portfolio.use-case'
import { owner, staff, teamRepository } from './team-fixtures'

const items = { properties: true, leads: false, opportunities: true, futureEvents: false }
const people = [
  staff({ id: 'owner-1', role: 'OWNER', name: 'Manager' }),
  staff({ id: 'source' }),
  staff({ id: 'destination' }),
  staff({ id: 'inactive', active: false }),
  staff({ id: 'invited', pendingInvitation: true }),
]

describe('ShareBrokerPortfolioUseCase', () => {
  it('delegates only selected items and the manager identity without transferring', async () => {
    const repository = teamRepository(people)
    const now = new Date('2030-01-01T12:00:00Z')
    await new ShareBrokerPortfolioUseCase(repository, () => now).execute({
      ...owner,
      brokerId: 'source',
      destinationIds: ['destination'],
      items,
    })
    expect(repository.sharePortfolio).toHaveBeenCalledWith({
      tenantId: owner.actorTenantId,
      sourceId: 'source',
      destinationIds: ['destination'],
      revoke: false,
      items,
      actor: { id: owner.actorId, name: 'Manager' },
      now,
    })
    expect(repository.transfer).not.toHaveBeenCalled()
    expect(repository.deactivateWithTransfer).not.toHaveBeenCalled()
  })
  it('allows the manager own portfolio as source', async () => {
    const repository = teamRepository(people)
    await new ShareBrokerPortfolioUseCase(repository).execute({
      ...owner,
      brokerId: owner.actorId,
      destinationIds: ['destination'],
      items,
    })
    expect(repository.sharePortfolio).toHaveBeenCalled()
  })
  it.each(['source', 'inactive', 'invited', 'missing', 'owner-1'])(
    'rejects destination %s',
    async (destinationId) => {
      const repository = teamRepository(people)
      await expect(
        new ShareBrokerPortfolioUseCase(repository).execute({
          ...owner,
          brokerId: 'source',
          destinationIds: [destinationId],
          items,
        }),
      ).rejects.toMatchObject({ code: 'INVALID_TRANSFER_DESTINATION' })
      expect(repository.sharePortfolio).not.toHaveBeenCalled()
    },
  )
  it('rejects an empty selection', async () => {
    const repository = teamRepository(people)
    await expect(
      new ShareBrokerPortfolioUseCase(repository).execute({
        ...owner,
        brokerId: 'source',
        destinationIds: ['destination'],
        items: { properties: false, leads: false, opportunities: false, futureEvents: false },
      }),
    ).rejects.toMatchObject({ code: 'EMPTY_TRANSFER' })
  })
  it.each(['BROKER', 'INDIVIDUAL'] as const)(
    'rejects the owner of a non-agency %s account',
    async (accountType) => {
      const repository = teamRepository(people)
      vi.mocked(repository.findTenantAccountType).mockResolvedValue(accountType)

      await expect(
        new ShareBrokerPortfolioUseCase(repository).execute({
          ...owner,
          brokerId: 'source',
          destinationIds: ['destination'],
          items,
        }),
      ).rejects.toMatchObject({ status: 403 })
      expect(repository.findTenantAccountType).toHaveBeenCalledWith(owner.actorTenantId)
      expect(repository.findStaffUser).not.toHaveBeenCalled()
      expect(repository.sharePortfolio).not.toHaveBeenCalled()
    },
  )
  it.each(['AGENT', 'RENTER', 'PROPERTY_OWNER'] as const)('rejects %s', async (actorRole) => {
    const repository = teamRepository(people)
    await expect(
      new ShareBrokerPortfolioUseCase(repository).execute({
        ...owner,
        actorRole,
        brokerId: 'source',
        destinationIds: ['destination'],
        items,
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(repository.sharePortfolio).not.toHaveBeenCalled()
  })
})
