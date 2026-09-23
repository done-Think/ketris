import type { Papel } from '@server/auth/domain/user.entity'

import { assertAgencyProfileAccess } from '../authorization'
import type { AgencyProfile } from '../../domain/agency-profile.entity'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'

export interface GetOwnAgencyProfileInput {
  actorTenantId: string
  actorPapel: Papel
}

export class GetOwnAgencyProfileUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(input: GetOwnAgencyProfileInput): Promise<AgencyProfile | null> {
    assertAgencyProfileAccess(input.actorPapel)

    return this.agencyProfileRepository.findByTenantId(input.actorTenantId)
  }
}
