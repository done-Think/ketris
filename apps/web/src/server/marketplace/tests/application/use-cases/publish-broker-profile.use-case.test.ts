import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import { BrokerProfileNotFoundError, ProfilePublishValidationError } from '../../../domain/errors'
import type { BrokerProfile } from '../../../types/broker-profile'
import type { BrokerProfileRepository } from '../../../application/ports/broker-profile-repository.port'
import { PublishBrokerProfileUseCase } from '../../../application/use-cases/publish-broker-profile.use-case'

function makeProfile(overrides: Partial<BrokerProfile> = {}): BrokerProfile {
  return {
    id: 'usuario-1',
    tenantId: 'tenant-1',
    agencyName: 'Imobiliária Horizonte',
    email: 'marina@ketris.com.br',
    displayName: 'Marina Costa',
    headline: 'Especialista em imóveis de alto padrão',
    bio: 'Corretora há 10 anos.',
    creci: 'SP-123456',
    phone: '(11) 90000-0000',
    region: 'Zona Sul de São Paulo',
    neighborhoods: ['Moema', 'Vila Mariana'],
    specialties: ['Apartamentos', 'Cobertura'],
    availability: 'Seg a sex, 9h às 18h',
    primaryColor: '#111111',
    secondaryColor: '#222222',
    backgroundColor: '#ffffff',
    avatarUrl: 'https://cdn.ketris.com.br/avatar.jpg',
    bannerUrl: 'https://cdn.ketris.com.br/banner.jpg',
    status: 'DRAFT',
    publishedAt: null,
    stats: { activeListings: 0, dealsClosed: 0 },
    recentListings: [],
    ...overrides,
  }
}

function createDeps(profile: BrokerProfile | null = makeProfile()) {
  const brokerProfileRepository: BrokerProfileRepository = {
    findPublishedById: vi.fn(),
    listPublished: vi.fn(),
    findByUsuarioId: vi.fn().mockResolvedValue(profile),
    save: vi.fn(),
    setStatus: vi.fn().mockResolvedValue(profile ? { ...profile, status: 'PUBLISHED' } : null),
  }

  return { brokerProfileRepository }
}

describe('PublishBrokerProfileUseCase', () => {
  it('publica quando todos os campos obrigatórios estão preenchidos', async () => {
    const deps = createDeps()
    const useCase = new PublishBrokerProfileUseCase(deps.brokerProfileRepository)

    const result = await useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT' })

    expect(result.status).toBe('PUBLISHED')
    expect(deps.brokerProfileRepository.setStatus).toHaveBeenCalledWith(
      'usuario-1',
      'PUBLISHED',
      expect.any(Date),
    )
  })

  it('lança ProfilePublishValidationError quando faltam campos obrigatórios', async () => {
    const deps = createDeps(makeProfile({ phone: null, bio: null }))
    const useCase = new PublishBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT' })).rejects.toThrow(
      ProfilePublishValidationError,
    )
    expect(deps.brokerProfileRepository.setStatus).not.toHaveBeenCalled()
  })

  it('lança ProfilePublishValidationError quando falta o creci', async () => {
    const deps = createDeps(makeProfile({ creci: null }))
    const useCase = new PublishBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT' })).rejects.toThrow(
      ProfilePublishValidationError,
    )
    expect(deps.brokerProfileRepository.setStatus).not.toHaveBeenCalled()
  })

  it('lança ProfilePublishValidationError quando falta a disponibilidade', async () => {
    const deps = createDeps(makeProfile({ availability: null }))
    const useCase = new PublishBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT' })).rejects.toThrow(
      ProfilePublishValidationError,
    )
    expect(deps.brokerProfileRepository.setStatus).not.toHaveBeenCalled()
  })

  it('lança ProfilePublishValidationError quando faltam bairros ou especialidades', async () => {
    const deps = createDeps(makeProfile({ neighborhoods: [], specialties: [] }))
    const useCase = new PublishBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT' })).rejects.toThrow(
      ProfilePublishValidationError,
    )
    expect(deps.brokerProfileRepository.setStatus).not.toHaveBeenCalled()
  })

  it('lança ProfilePublishValidationError quando falta a foto de perfil ou a imagem de capa', async () => {
    const deps = createDeps(makeProfile({ avatarUrl: null, bannerUrl: null }))
    const useCase = new PublishBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT' })).rejects.toThrow(
      ProfilePublishValidationError,
    )
    expect(deps.brokerProfileRepository.setStatus).not.toHaveBeenCalled()
  })

  it('lança BrokerProfileNotFoundError quando o perfil ainda não foi criado', async () => {
    const deps = createDeps(null)
    const useCase = new PublishBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(useCase.execute({ actorId: 'usuario-1', actorPapel: 'AGENT' })).rejects.toThrow(
      BrokerProfileNotFoundError,
    )
  })

  it('lança ForbiddenError quando o ator não é AGENT', async () => {
    const deps = createDeps()
    const useCase = new PublishBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(useCase.execute({ actorId: 'usuario-1', actorPapel: 'OWNER' })).rejects.toThrow(
      ForbiddenError,
    )
  })
})
