import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import { AgencyProfileNotFoundError, ProfilePublishValidationError } from '../../domain/errors'
import type { AgencyProfile } from '../../domain/agency-profile.entity'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'
import { PublishAgencyProfileUseCase } from './publish-agency-profile.use-case'

function makeProfile(overrides: Partial<AgencyProfile> = {}): AgencyProfile {
  return {
    id: 'tenant-1',
    displayName: 'Imobiliária Horizonte',
    headline: null,
    summary: 'A imobiliária mais completa da cidade.',
    legalCreci: null,
    headquarters: null,
    address: null,
    phone: '(11) 90000-0000',
    email: null,
    coverage: [],
    segments: [],
    yearsInMarket: null,
    primaryColor: null,
    secondaryColor: null,
    backgroundColor: null,
    logoUrl: null,
    bannerUrl: null,
    status: 'DRAFT',
    publishedAt: null,
    stats: { activeListings: 0, brokersCount: 0, dealsClosed: 0 },
    team: [],
    featuredListings: [],
    ...overrides,
  }
}

function createDeps(profile: AgencyProfile | null = makeProfile()) {
  const agencyProfileRepository: AgencyProfileRepository = {
    findPublishedById: vi.fn(),
    listPublished: vi.fn(),
    findByTenantId: vi.fn().mockResolvedValue(profile),
    save: vi.fn(),
    setStatus: vi.fn().mockResolvedValue(profile ? { ...profile, status: 'PUBLISHED' } : null),
  }

  return { agencyProfileRepository }
}

describe('PublishAgencyProfileUseCase', () => {
  it('publica quando contato e resumo estão preenchidos', async () => {
    const deps = createDeps()
    const useCase = new PublishAgencyProfileUseCase(deps.agencyProfileRepository)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN' })

    expect(result.status).toBe('PUBLISHED')
  })

  it('lança ProfilePublishValidationError quando faltam campos obrigatórios', async () => {
    const deps = createDeps(makeProfile({ phone: null, email: null, summary: null }))
    const useCase = new PublishAgencyProfileUseCase(deps.agencyProfileRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN' }),
    ).rejects.toThrow(ProfilePublishValidationError)
  })

  it('lança AgencyProfileNotFoundError quando o perfil ainda não foi criado', async () => {
    const deps = createDeps(null)
    const useCase = new PublishAgencyProfileUseCase(deps.agencyProfileRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN' }),
    ).rejects.toThrow(AgencyProfileNotFoundError)
  })

  it('lança ForbiddenError quando o ator não é ADMIN/OWNER', async () => {
    const deps = createDeps()
    const useCase = new PublishAgencyProfileUseCase(deps.agencyProfileRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'AGENT' }),
    ).rejects.toThrow(ForbiddenError)
  })
})
