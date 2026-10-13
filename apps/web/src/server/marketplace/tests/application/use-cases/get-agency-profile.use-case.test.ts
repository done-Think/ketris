import { describe, expect, it, vi } from 'vitest'

import { AgencyProfileNotFoundError } from '../../../domain/errors'
import type { AgencyProfile } from '../../../types/agency-profile'
import type { AgencyProfileRepository } from '../../../application/ports/agency-profile-repository.port'
import { GetAgencyProfileUseCase } from '../../../application/use-cases/get-agency-profile.use-case'

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

function createDeps(findPublishedById?: AgencyProfileRepository['findPublishedById']) {
  const agencyProfileRepository: AgencyProfileRepository = {
    findPublishedById: findPublishedById ?? vi.fn().mockResolvedValue(profile),
    findPublishedBySlug: vi.fn().mockResolvedValue(profile),
    listPublished: vi.fn(),
    findByTenantId: vi.fn(),
    save: vi.fn(),
    setStatus: vi.fn(),
  }

  return { agencyProfileRepository }
}

describe('GetAgencyProfileUseCase', () => {
  it('retorna o perfil publico da imobiliaria por id', async () => {
    const deps = createDeps()
    const useCase = new GetAgencyProfileUseCase(deps.agencyProfileRepository)

    const result = await useCase.execute({ id: 'tenant-1' })

    expect(result.id).toBe('tenant-1')
  })

  it('retorna o perfil publico pelo slug da imobiliaria e numeros do CRECI', async () => {
    const deps = createDeps()
    const useCase = new GetAgencyProfileUseCase(deps.agencyProfileRepository)

    const result = await useCase.execute({ slug: 'imobiliaria-horizonte', creci: '654321' })

    expect(result.id).toBe('tenant-1')
    expect(deps.agencyProfileRepository.findPublishedBySlug).toHaveBeenCalledWith(
      'imobiliaria-horizonte',
      '654321',
    )
    expect(deps.agencyProfileRepository.findPublishedById).not.toHaveBeenCalled()
  })

  it('lanca AgencyProfileNotFoundError quando nao existe ou nao esta publicado', async () => {
    const deps = createDeps(vi.fn().mockResolvedValue(null))
    const useCase = new GetAgencyProfileUseCase(deps.agencyProfileRepository)

    await expect(useCase.execute({ id: 'inexistente' })).rejects.toThrow(AgencyProfileNotFoundError)
  })
})
