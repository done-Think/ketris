import { assertAgencyProfileAccess } from '../authorization'
import { AgencyProfileNotFoundError } from '../../domain/errors'
import type { AgencyProfile } from '../../types/agency-profile'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'
import type { UnpublishAgencyProfileInput } from '../../types/use-case-inputs'

export class UnpublishAgencyProfileUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(input: UnpublishAgencyProfileInput): Promise<AgencyProfile> {
    assertAgencyProfileAccess(input.actorRole)

    const unpublished = await this.agencyProfileRepository.setStatus(
      input.actorTenantId,
      'DRAFT',
      null,
      input.actorId,
    )

    if (!unpublished) {
      throw new AgencyProfileNotFoundError()
    }

    return unpublished
  }
}
