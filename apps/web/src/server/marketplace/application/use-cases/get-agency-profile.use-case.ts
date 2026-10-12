import { AgencyProfileNotFoundError } from '../../domain/errors'
import type { AgencyProfile } from '../../types/agency-profile'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'

export interface GetAgencyProfileInput {
  id?: string
  slug?: string
  creci?: string
}

export class GetAgencyProfileUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(input: GetAgencyProfileInput): Promise<AgencyProfile> {
    const profile =
      input.slug && input.creci
        ? await this.agencyProfileRepository.findPublishedBySlug(input.slug, input.creci)
        : input.id
          ? await this.agencyProfileRepository.findPublishedById(input.id)
          : null

    if (!profile) {
      throw new AgencyProfileNotFoundError()
    }

    return profile
  }
}
