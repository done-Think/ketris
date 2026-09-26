import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import { AgencyProfileNotFoundError } from '../../domain/errors'
import type { AgencyProfile } from '../../domain/agency-profile.entity'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'
import { UnpublishAgencyProfileUseCase } from './unpublish-agency-profile.use-case'

function createDeps(setStatusResult: AgencyProfile | null) {
  const agencyProfileRepository: AgencyProfileRepository = {
    findPublishedById: vi.fn(),
    listPublished: vi.fn(),
    findByTenantId: vi.fn(),
    save: vi.fn(),
    setStatus: vi.fn().mockResolvedValue(setStatusResult),
  }

  return { agencyProfileRepository }
}

describe('UnpublishAgencyProfileUseCase', () => {
  it('despublica o perfil do próprio tenant', async () => {
    const deps = createDeps({ status: 'DRAFT' } as AgencyProfile)
    const useCase = new UnpublishAgencyProfileUseCase(deps.agencyProfileRepository)

    await useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'OWNER' })

    expect(deps.agencyProfileRepository.setStatus).toHaveBeenCalledWith('tenant-1', 'DRAFT', null)
  })

  it('lança AgencyProfileNotFoundError quando o perfil não existe', async () => {
    const deps = createDeps(null)
    const useCase = new UnpublishAgencyProfileUseCase(deps.agencyProfileRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'ADMIN' }),
    ).rejects.toThrow(AgencyProfileNotFoundError)
  })

  it('lança ForbiddenError quando o ator não é ADMIN/OWNER', async () => {
    const deps = createDeps({ status: 'DRAFT' } as AgencyProfile)
    const useCase = new UnpublishAgencyProfileUseCase(deps.agencyProfileRepository)

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'AGENT' }),
    ).rejects.toThrow(ForbiddenError)
  })
})
