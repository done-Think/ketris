import { describe, expect, it, vi } from 'vitest'

import { BrokerProfileNotFoundError } from '../../domain/errors'
import type { BrokerProfile } from '../../domain/broker-profile.entity'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'
import { GetBrokerProfileUseCase } from './get-broker-profile.use-case'

const profile: BrokerProfile = {
  id: 'usuario-1',
  tenantId: 'tenant-1',
  agencyName: 'Imobiliária Horizonte',
  email: 'marina@ketris.com.br',
  displayName: 'Marina Costa',
  headline: 'Especialista em Jardins',
  bio: 'Corretora há 10 anos.',
  creci: '12345-F',
  phone: '(11) 90000-0000',
  region: 'São Paulo',
  neighborhoods: ['Jardins'],
  specialties: ['Alto padrão'],
  availability: 'Segunda a sexta',
  primaryColor: '#F30274',
  secondaryColor: '#212631',
  backgroundColor: '#FFFFFF',
  avatarUrl: null,
  bannerUrl: null,
  status: 'PUBLISHED',
  publishedAt: new Date('2026-09-01T00:00:00.000Z'),
  stats: { activeListings: 3, dealsClosed: 1 },
  recentListings: [],
}

function createDeps(findPublishedById?: BrokerProfileRepository['findPublishedById']) {
  const brokerProfileRepository: BrokerProfileRepository = {
    findPublishedById: findPublishedById ?? vi.fn().mockResolvedValue(profile),
    listPublished: vi.fn(),
    findByUsuarioId: vi.fn(),
    save: vi.fn(),
    setStatus: vi.fn(),
  }

  return { brokerProfileRepository }
}

describe('GetBrokerProfileUseCase', () => {
  it('retorna o perfil público sem expor o tenantId', async () => {
    const deps = createDeps()
    const useCase = new GetBrokerProfileUseCase(deps.brokerProfileRepository)

    const result = await useCase.execute({ id: 'usuario-1' })

    expect(result.id).toBe('usuario-1')
    expect(result).not.toHaveProperty('tenantId')
  })

  it('lança BrokerProfileNotFoundError quando não existe ou não está publicado', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue(null))
    const useCase = new GetBrokerProfileUseCase(deps.brokerProfileRepository)

    await expect(useCase.execute({ id: 'inexistente' })).rejects.toThrow(BrokerProfileNotFoundError)
  })
})
