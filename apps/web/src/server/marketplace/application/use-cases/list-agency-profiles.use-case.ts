import type { AgencyProfile } from '../../domain/agency-profile.entity'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'

export class ListAgencyProfilesUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(): Promise<AgencyProfile[]> {
    return this.agencyProfileRepository.listPublished()
  }
}
