import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import type { AgencyProfile } from '../../domain/agency-profile.entity'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'
import { SaveAgencyProfileUseCase } from './save-agency-profile.use-case'

const draft = {
  displayName: 'Imobiliária Horizonte',
  headline: null,
  summary: null,
  legalCreci: null,
  headquarters: null,
  address: null,
  phone: null,
  email: null,
  coverage: [],
  segments: [],
  yearsInMarket: null,
  backgroundColor: null,
  logoUrl: null,
  bannerUrl: null,
  team: [{ usuarioId: 'usuario-1', order: 0 }],
}

function createDeps() {
  const agencyProfileRepository: AgencyProfileRepository = {
    findPublishedById: vi.fn(),
    listPublished: vi.fn(),
    findByTenantId: vi.fn(),
    save: vi.fn().mockResolvedValue({} as AgencyProfile),
    setStatus: vi.fn(),
  }

  return { agencyProfileRepository }
}

describe('SaveAgencyProfileUseCase', () => {
  it('salva o perfil do próprio tenant quando o ator é ADMIN/OWNER', async () => {
    const deps = createDeps()
    const useCase = new SaveAgencyProfileUseCase(deps.agencyProfileRepository)

    await useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN', ...draft })

    expect(deps.agencyProfileRepository.save).toHaveBeenCalledWith('tenant-1', draft)
  })

  it('lança ForbiddenError quando o ator é AGENT', async () => {
    const deps = createDeps()
    const useCase = new SaveAgencyProfileUseCase(deps.agencyProfileRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'AGENT', ...draft }),
    ).rejects.toThrow(ForbiddenError)
    expect(deps.agencyProfileRepository.save).not.toHaveBeenCalled()
  })
})
