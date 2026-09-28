import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import type { BrokerProfile } from '../../domain/broker-profile.entity'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'
import { SaveBrokerProfileUseCase } from './save-broker-profile.use-case'

const draft = {
  displayName: 'Marina Costa',
  headline: null,
  bio: null,
  creci: null,
  phone: null,
  region: null,
  neighborhoods: [],
  specialties: [],
  availability: null,
  primaryColor: null,
  secondaryColor: null,
  backgroundColor: null,
  avatarUrl: null,
  bannerUrl: null,
}

function createDeps() {
  const brokerProfileRepository: BrokerProfileRepository = {
    findPublishedById: vi.fn(),
    listPublished: vi.fn(),
    findByUsuarioId: vi.fn(),
    save: vi.fn().mockResolvedValue({} as BrokerProfile),
    setStatus: vi.fn(),
  }

  return { brokerProfileRepository }
}

describe('SaveBrokerProfileUseCase', () => {
  it('salva o perfil do próprio ator quando ele é AGENT', async () => {
    const deps = createDeps()
    const useCase = new SaveBrokerProfileUseCase(deps.brokerProfileRepository)

    await useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT', ...draft })

    expect(deps.brokerProfileRepository.save).toHaveBeenCalledWith('usuario-1', draft)
  })

  it('lança ForbiddenError quando o ator não é AGENT', async () => {
    const deps = createDeps()
    const useCase = new SaveBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(
      useCase.execute({ actorId: 'usuario-1', actorPapel: 'ADMIN', ...draft }),
    ).rejects.toThrow(ForbiddenError)
    expect(deps.brokerProfileRepository.save).not.toHaveBeenCalled()
  })
})
