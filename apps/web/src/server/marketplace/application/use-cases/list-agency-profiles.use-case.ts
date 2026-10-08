import type { AgencyProfile } from '../../types/agency-profile'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'

export class ListAgencyProfilesUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(): Promise<AgencyProfile[]> {
    return this.agencyProfileRepository.listPublished()
  }
}
