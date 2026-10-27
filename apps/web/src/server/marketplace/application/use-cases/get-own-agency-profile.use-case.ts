import { assertAgencyProfileAccess } from '../authorization'
import type { AgencyProfile } from '../../types/agency-profile'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'
import type { GetOwnAgencyProfileInput } from '../../types/use-case-inputs'

export class GetOwnAgencyProfileUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(input: GetOwnAgencyProfileInput): Promise<AgencyProfile | null> {
    assertAgencyProfileAccess(input.actorPapel)

    return this.agencyProfileRepository.findByTenantId(input.actorTenantId)
  }
}
