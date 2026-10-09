import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import { AgencyProfileNotFoundError, ProfilePublishValidationError } from '../../../domain/errors'
import type { AgencyProfile } from '../../../types/agency-profile'
import type { AgencyProfileRepository } from '../../../application/ports/agency-profile-repository.port'
import { PublishAgencyProfileUseCase } from '../../../application/use-cases/publish-agency-profile.use-case'

function makeProfile(overrides: Partial<AgencyProfile> = {}): AgencyProfile {
  return {
    id: 'tenant-1',
    displayName: 'Imobiliária Horizonte',
    headline: 'A imobiliária que entende você',
    summary: 'A imobiliária mais completa da cidade.',
    legalCreci: 'SP-654321',
    headquarters: 'São Paulo, SP',
    address: 'Av. Paulista, 1000',
    phone: '(11) 90000-0000',
    email: null,
    coverage: ['Zona Sul', 'Zona Oeste'],
    segments: ['Residencial', 'Comercial'],
    yearsInMarket: 15,
    primaryColor: null,
    secondaryColor: null,
    backgroundColor: '#ffffff',
    logoUrl: 'https://cdn.ketris.com.br/logo.jpg',
    bannerUrl: 'https://cdn.ketris.com.br/banner.jpg',
    status: 'DRAFT',
    publishedAt: null,
    stats: { activeListings: 0, brokersCount: 0, dealsClosed: 0 },
    team: [{ usuarioId: 'broker-1', name: 'Marina Costa', avatarUrl: null, order: 0 }],
    featuredListings: [],
    ...overrides,
  }
}

function createDeps(profile: AgencyProfile | null = makeProfile()) {
  const agencyProfileRepository: AgencyProfileRepository = {
    findPublishedById: vi.fn(),
    findPublishedBySlug: vi.fn(),
    listPublished: vi.fn(),
    findByTenantId: vi.fn().mockResolvedValue(profile),
    save: vi.fn(),
    setStatus: vi.fn().mockResolvedValue(profile ? { ...profile, status: 'PUBLISHED' } : null),
  }

  return { agencyProfileRepository }
}

describe('PublishAgencyProfileUseCase', () => {
  it('publica quando todos os campos obrigatórios estão preenchidos', async () => {
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

  it('lança ProfilePublishValidationError quando falta o creci', async () => {
    const deps = createDeps(makeProfile({ legalCreci: null }))
    const useCase = new PublishAgencyProfileUseCase(deps.agencyProfileRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN' }),
    ).rejects.toThrow(ProfilePublishValidationError)
  })

  it('lança ProfilePublishValidationError quando falta cobertura, segmentos ou equipe', async () => {
    const deps = createDeps(makeProfile({ coverage: [], segments: [], team: [] }))
    const useCase = new PublishAgencyProfileUseCase(deps.agencyProfileRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN' }),
    ).rejects.toThrow(ProfilePublishValidationError)
  })

  it('lança ProfilePublishValidationError quando falta o logotipo ou a imagem de capa', async () => {
    const deps = createDeps(makeProfile({ logoUrl: null, bannerUrl: null }))
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
