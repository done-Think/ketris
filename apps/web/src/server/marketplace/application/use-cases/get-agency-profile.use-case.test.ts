import { describe, expect, it, vi } from 'vitest'

import { AgencyProfileNotFoundError } from '../../domain/errors'
import type { AgencyProfile } from '../../domain/agency-profile.entity'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'
import { GetAgencyProfileUseCase } from './get-agency-profile.use-case'

const profile: AgencyProfile = {
  id: 'tenant-1',
  displayName: 'Imobiliária Horizonte',
  headline: null,
  summary: 'A imobiliária mais completa da cidade.',
  legalCreci: null,
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

function createDeps(findPublishedById?: AgencyProfileRepository['findPublishedById']) {
  const agencyProfileRepository: AgencyProfileRepository = {
    findPublishedById: findPublishedById ?? vi.fn().mockResolvedValue(profile),
    listPublished: vi.fn(),
    findByTenantId: vi.fn(),
    save: vi.fn(),
    setStatus: vi.fn(),
  }

  return { agencyProfileRepository }
}

describe('GetAgencyProfileUseCase', () => {
  it('retorna o perfil público da imobiliária', async () => {
    const deps = createDeps()
    const useCase = new GetAgencyProfileUseCase(deps.agencyProfileRepository)

    const result = await useCase.execute({ id: 'tenant-1' })

    expect(result.id).toBe('tenant-1')
  })

  it('lança AgencyProfileNotFoundError quando não existe ou não está publicado', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue(null))
    const useCase = new GetAgencyProfileUseCase(deps.agencyProfileRepository)

    await expect(useCase.execute({ id: 'inexistente' })).rejects.toThrow(AgencyProfileNotFoundError)
  })
})
