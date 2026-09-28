import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'
import { GetOwnBrokerProfileUseCase } from './get-own-broker-profile.use-case'

function createDeps() {
  const brokerProfileRepository: BrokerProfileRepository = {
    findPublishedById: vi.fn(),
    listPublished: vi.fn(),
    findByUsuarioId: vi.fn().mockResolvedValue(null),
    save: vi.fn(),
    setStatus: vi.fn(),
  }

  return { brokerProfileRepository }
}

describe('GetOwnBrokerProfileUseCase', () => {
  it('busca o próprio perfil quando o ator é AGENT', async () => {
    const deps = createDeps()
    const useCase = new GetOwnBrokerProfileUseCase(deps.brokerProfileRepository)

    await useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT' })

    expect(deps.brokerProfileRepository.findByUsuarioId).toHaveBeenCalledWith('usuario-1')
  })

  it.each(['ADMIN', 'OWNER', 'RENTER'] as const)(
    'lança ForbiddenError quando o ator não é AGENT (%s)',
    async (actorPapel) => {
      const deps = createDeps()
      const useCase = new GetOwnBrokerProfileUseCase(deps.brokerProfileRepository)

      await expect(useCase.execute({ actorId: 'usuario-1', actorPapel })).rejects.toThrow(
        ForbiddenError,
      )
    },
  )
})
