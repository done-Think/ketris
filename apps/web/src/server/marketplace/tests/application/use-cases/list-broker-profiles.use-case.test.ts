import { describe, expect, it, vi } from 'vitest'

import type { BrokerProfile } from '../../../types/broker-profile'
import type { BrokerProfileRepository } from '../../../application/ports/broker-profile-repository.port'
import { ListBrokerProfilesUseCase } from '../../../application/use-cases/list-broker-profiles.use-case'

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

function createRepository(listPublished: BrokerProfileRepository['listPublished']) {
  const brokerProfileRepository: BrokerProfileRepository = {
    findPublishedById: vi.fn(),
    listPublished,
    findByUsuarioId: vi.fn(),
    save: vi.fn(),
    setStatus: vi.fn(),
  }

  return brokerProfileRepository
}

describe('ListBrokerProfilesUseCase', () => {
  it('lista os corretores publicados da página sem expor o tenantId', async () => {
    const other = { ...profile, id: 'usuario-2', tenantId: 'tenant-2', displayName: 'João' }
    const listPublished = vi.fn().mockResolvedValue({ items: [profile, other], totalCount: 9 })
    const useCase = new ListBrokerProfilesUseCase(createRepository(listPublished))

    const result = await useCase.execute({ q: 'jardins', page: 1, pageSize: 2 })

    expect(listPublished).toHaveBeenCalledWith({ q: 'jardins' }, { page: 1, pageSize: 2 })
    expect(result).toMatchObject({ totalCount: 9, page: 1, pageSize: 2 })
    expect(result.items.map((broker) => broker.id)).toEqual(['usuario-1', 'usuario-2'])
    for (const broker of result.items) expect(broker).not.toHaveProperty('tenantId')
  })

  it('retorna página vazia quando não há corretores publicados', async () => {
    const useCase = new ListBrokerProfilesUseCase(
      createRepository(vi.fn().mockResolvedValue({ items: [], totalCount: 0 })),
    )

    await expect(useCase.execute({ page: 1, pageSize: 12 })).resolves.toMatchObject({
      items: [],
      totalCount: 0,
    })
  })
})
