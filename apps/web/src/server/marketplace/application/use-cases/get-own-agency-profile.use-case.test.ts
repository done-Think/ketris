import { describe, expect, it, vi } from 'vitest'

import { ForbiddenError } from '@server/shared/errors'

import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'
import { GetOwnAgencyProfileUseCase } from './get-own-agency-profile.use-case'

function createDeps() {
  const agencyProfileRepository: AgencyProfileRepository = {
    findPublishedById: vi.fn(),
    listPublished: vi.fn(),
    findByTenantId: vi.fn().mockResolvedValue(null),
    save: vi.fn(),
    setStatus: vi.fn(),
  }

  return { agencyProfileRepository }
}

describe('GetOwnAgencyProfileUseCase', () => {
  it.each(['ADMIN', 'OWNER'] as const)(
    'busca o perfil do tenant quando o ator é %s',
    async (actorPapel) => {
      const deps = createDeps()
      const useCase = new GetOwnAgencyProfileUseCase(deps.agencyProfileRepository)

      await useCase.execute({ actorTenantId: 'tenant-1', actorPapel })

      expect(deps.agencyProfileRepository.findByTenantId).toHaveBeenCalledWith('tenant-1')
    },
  )

  it.each(['AGENT', 'RENTER'] as const)(
    'lança ForbiddenError quando o ator não é ADMIN/OWNER (%s)',
    async (actorPapel) => {
      const deps = createDeps()
      const useCase = new GetOwnAgencyProfileUseCase(deps.agencyProfileRepository)

      await expect(useCase.execute({ actorTenantId: 'tenant-1', actorPapel })).rejects.toThrow(
        ForbiddenError,
      )
    },
  )
})
