import type { Papel } from '@server/auth/domain/user.entity'

import { assertAgencyProfileAccess } from '../authorization'
import { AgencyProfileNotFoundError } from '../../domain/errors'
import type { AgencyProfile } from '../../domain/agency-profile.entity'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'

export interface UnpublishAgencyProfileInput {
  actorTenantId: string
  actorPapel: Papel
}

export class UnpublishAgencyProfileUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(input: UnpublishAgencyProfileInput): Promise<AgencyProfile> {
    assertAgencyProfileAccess(input.actorPapel)

    const unpublished = await this.agencyProfileRepository.setStatus(
      input.actorTenantId,
      'DRAFT',
      null,
    )

    if (!unpublished) {
      throw new AgencyProfileNotFoundError()
    }

    return unpublished
  }
}
