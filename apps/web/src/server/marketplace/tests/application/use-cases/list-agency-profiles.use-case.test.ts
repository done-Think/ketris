import { describe, expect, it, vi } from 'vitest'

import type { AgencyProfile } from '../../../types/agency-profile'
import type { AgencyProfileRepository } from '../../../application/ports/agency-profile-repository.port'
import { ListAgencyProfilesUseCase } from '../../../application/use-cases/list-agency-profiles.use-case'

const profile: AgencyProfile = {
  id: 'tenant-1',
  displayName: 'Imobiliaria Horizonte',
  headline: null,
  summary: 'A imobiliaria mais completa da cidade.',
  legalCreci: 'CRECI-SP 654.321-J',
  headquarters: null,
  address: null,
  phone: '(11) 90000-0000',
  email: 'contato@horizonte.com.br',
  coverage: [],
  segments: [],
  yearsInMarket: null,
  primaryColor: '#F30274',
  secondaryColor: '#212631',
  backgroundColor: null,
  logoUrl: null,
  bannerUrl: null,
  status: 'PUBLISHED',
  publishedAt: new Date('2026-09-01T00:00:00.000Z'),
  stats: { activeListings: 3, brokersCount: 4, dealsClosed: 0 },
  team: [],
  featuredListings: [],
}

function createRepository(listPublished: AgencyProfileRepository['listPublished']) {
  const agencyProfileRepository: AgencyProfileRepository = {
    findPublishedById: vi.fn(),
    findPublishedBySlug: vi.fn(),
    listPublished,
    findByTenantId: vi.fn(),
    save: vi.fn(),
    setStatus: vi.fn(),
  }

  return agencyProfileRepository
}

describe('ListAgencyProfilesUseCase', () => {
  it('pede ao repositório a busca e a página e devolve o total encontrado', async () => {
    const listPublished = vi.fn().mockResolvedValue({ items: [profile], totalCount: 7 })
    const useCase = new ListAgencyProfilesUseCase(createRepository(listPublished))

    await expect(useCase.execute({ q: 'centro', page: 2, pageSize: 3 })).resolves.toEqual({
      items: [profile],
      totalCount: 7,
      page: 2,
      pageSize: 3,
    })
    expect(listPublished).toHaveBeenCalledWith({ q: 'centro' }, { page: 2, pageSize: 3 })
  })

  it('retorna página vazia quando não há imobiliárias publicadas', async () => {
    const useCase = new ListAgencyProfilesUseCase(
      createRepository(vi.fn().mockResolvedValue({ items: [], totalCount: 0 })),
    )

    await expect(useCase.execute({ page: 1, pageSize: 12 })).resolves.toMatchObject({
      items: [],
      totalCount: 0,
    })
  })
})
