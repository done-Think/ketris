import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import type { AgencyProfileRepository } from '../../../application/ports/agency-profile-repository.port'
import { GetOwnAgencyProfileUseCase } from '../../../application/use-cases/get-own-agency-profile.use-case'

function createDeps() {
  const agencyProfileRepository: AgencyProfileRepository = {
    findForEditor: vi.fn().mockResolvedValue(null),
    findPublishedById: vi.fn(),
    findPublishedBySlug: vi.fn(),
    listPublished: vi.fn(),
    findByTenantId: vi.fn().mockResolvedValue(null),
    save: vi.fn(),
    setStatus: vi.fn(),
  }

  return { agencyProfileRepository }
}

describe('GetOwnAgencyProfileUseCase', () => {
  it.each(['OWNER'] as const)('busca o perfil do tenant quando o ator é %s', async (actorRole) => {
    const deps = createDeps()
    const useCase = new GetOwnAgencyProfileUseCase(deps.agencyProfileRepository)

    await useCase.execute({ actorTenantId: 'tenant-1', actorId: 'owner-1', actorRole })

    expect(deps.agencyProfileRepository.findForEditor).toHaveBeenCalledWith('tenant-1', 'owner-1')
  })

  it.each(['AGENT', 'RENTER'] as const)(
    'lança ForbiddenError quando o ator não é OWNER (%s)',
    async (actorRole) => {
      const deps = createDeps()
      const useCase = new GetOwnAgencyProfileUseCase(deps.agencyProfileRepository)

      await expect(
        useCase.execute({ actorTenantId: 'tenant-1', actorId: 'owner-1', actorRole }),
      ).rejects.toThrow(ForbiddenError)
    },
  )
})
