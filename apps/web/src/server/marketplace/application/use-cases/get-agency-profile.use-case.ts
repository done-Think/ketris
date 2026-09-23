import { AgencyProfileNotFoundError } from '../../domain/errors'
import type { AgencyProfile } from '../../domain/agency-profile.entity'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'

export interface GetAgencyProfileInput {
  id: string
}

export class GetAgencyProfileUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(input: GetAgencyProfileInput): Promise<AgencyProfile> {
    const profile = await this.agencyProfileRepository.findPublishedById(input.id)

    if (!profile) {
      throw new AgencyProfileNotFoundError()
    }

    return profile
  }
}
