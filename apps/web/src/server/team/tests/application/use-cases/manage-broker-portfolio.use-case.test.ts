import { describe, expect, it } from 'vitest'

import {
  DeactivateBrokerUseCase,
  TransferBrokerPortfolioUseCase,
} from '../../../application/use-cases/manage-broker-portfolio.use-case'
import {
  CannotDeactivateSelfFromTeamError,
  EmptyTransferError,
  InvalidTransferDestinationError,
  TeamMemberNotFoundError,
} from '../../../domain/errors'
import { owner, staff, teamRepository } from './team-fixtures'

const now = new Date('2026-10-20T12:00:00.000Z')
const people = [
  staff({ id: 'owner-1', name: 'Dona', papel: 'OWNER' }),
  staff({ id: 'agent-1', name: 'Marina' }),
  staff({ id: 'agent-2', name: 'Thiago' }),
  staff({ id: 'agent-3', name: 'Inativo', active: false }),
  staff({ id: 'agent-4', name: 'Convidado', pendingInvitation: true }),
]
const allItems = { properties: true, leads: true, futureEvents: true }

describe('TransferBrokerPortfolioUseCase', () => {
  it('transfere os itens escolhidos e registra quem fez', async () => {
    const repository = teamRepository(people)

    await new TransferBrokerPortfolioUseCase(repository, () => now).execute({
      ...owner,
      brokerId: 'agent-1',
      destinationId: 'agent-2',
      items: { properties: true, leads: false, futureEvents: false },
    })

    expect(repository.transfer).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      sourceId: 'agent-1',
      destinationId: 'agent-2',
      items: { properties: true, leads: false, futureEvents: false },
      reason: 'MANUAL',
      actor: { id: 'owner-1', name: 'Dona' },
      now,
    })
  })

  it.each([
    ['o próprio corretor', 'agent-1'],
    ['um corretor inativo', 'agent-3'],
    ['um convite pendente', 'agent-4'],
    ['alguém de fora da equipe', 'agent-9'],
  ])('recusa como destino %s', async (_label, destinationId) => {
    const repository = teamRepository(people)

    await expect(
      new TransferBrokerPortfolioUseCase(repository).execute({
        ...owner,
        brokerId: 'agent-1',
        destinationId,
        items: allItems,
      }),
    ).rejects.toBeInstanceOf(InvalidTransferDestinationError)
    expect(repository.transfer).not.toHaveBeenCalled()
  })

  it('exige ao menos um item e um corretor de origem válido', async () => {
    const repository = teamRepository(people)
    const useCase = new TransferBrokerPortfolioUseCase(repository)

    await expect(
      useCase.execute({
        ...owner,
        brokerId: 'agent-1',
        destinationId: 'agent-2',
        items: { properties: false, leads: false, futureEvents: false },
      }),
    ).rejects.toBeInstanceOf(EmptyTransferError)
    await expect(
      useCase.execute({ ...owner, brokerId: 'owner-1', destinationId: 'agent-2', items: allItems }),
    ).rejects.toBeInstanceOf(TeamMemberNotFoundError)
  })

  it('só o OWNER transfere', async () => {
    await expect(
      new TransferBrokerPortfolioUseCase(teamRepository(people)).execute({
        ...owner,
        actorPapel: 'AGENT',
        brokerId: 'agent-1',
        destinationId: 'agent-2',
        items: allItems,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe('DeactivateBrokerUseCase', () => {
  it('desativa transferindo toda a carteira para o destino obrigatório', async () => {
    const repository = teamRepository(people)

    const result = await new DeactivateBrokerUseCase(repository, () => now).execute({
      ...owner,
      brokerId: 'agent-1',
      destinationId: 'owner-1',
    })

    expect(result.eventIds).toEqual(['e1'])
    expect(repository.deactivateWithTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 'agent-1',
        destinationId: 'owner-1',
        items: allItems,
        reason: 'DESATIVACAO',
      }),
    )
  })

  it('não desativa sem destino válido, já inativo ou a própria conta', async () => {
    const repository = teamRepository(people)
    const useCase = new DeactivateBrokerUseCase(repository)

    await expect(
      useCase.execute({ ...owner, brokerId: 'agent-1', destinationId: 'agent-3' }),
    ).rejects.toBeInstanceOf(InvalidTransferDestinationError)
    await expect(
      useCase.execute({ ...owner, brokerId: 'agent-3', destinationId: 'agent-2' }),
    ).rejects.toBeInstanceOf(TeamMemberNotFoundError)
    await expect(
      useCase.execute({ ...owner, brokerId: 'owner-1', destinationId: 'agent-2' }),
    ).rejects.toBeInstanceOf(CannotDeactivateSelfFromTeamError)
    expect(repository.deactivateWithTransfer).not.toHaveBeenCalled()
  })
})
