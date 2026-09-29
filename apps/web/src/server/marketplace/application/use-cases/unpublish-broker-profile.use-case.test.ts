import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import { BrokerProfileNotFoundError } from '../../domain/errors'
import type { BrokerProfile } from '../../domain/broker-profile.entity'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'
import { UnpublishBrokerProfileUseCase } from './unpublish-broker-profile.use-case'

function createDeps(setStatusResult: BrokerProfile | null) {
  const brokerProfileRepository: BrokerProfileRepository = {
    findPublishedById: vi.fn(),
    listPublished: vi.fn(),
    findByUsuarioId: vi.fn(),
    save: vi.fn(),
    setStatus: vi.fn().mockResolvedValue(setStatusResult),
  }

  return { brokerProfileRepository }
}

describe('UnpublishBrokerProfileUseCase', () => {
  it('despublica o perfil do próprio ator', async () => {
    const deps = createDeps({ status: 'DRAFT' } as BrokerProfile)
    const useCase = new UnpublishBrokerProfileUseCase(deps.brokerProfileRepository)

    await useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT' })

    expect(deps.brokerProfileRepository.setStatus).toHaveBeenCalledWith('usuario-1', 'DRAFT', null)
  })

  it('lança BrokerProfileNotFoundError quando o perfil não existe', async () => {
    const deps = createDeps(null)
    const useCase = new UnpublishBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT' })).rejects.toThrow(
      BrokerProfileNotFoundError,
    )
  })

  it('lança ForbiddenError quando o ator não é AGENT', async () => {
    const deps = createDeps({ status: 'DRAFT' } as BrokerProfile)
    const useCase = new UnpublishBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(useCase.execute({ actorId: 'usuario-1', actorPapel: 'RENTER' })).rejects.toThrow(
      ForbiddenError,
    )
  })
})
