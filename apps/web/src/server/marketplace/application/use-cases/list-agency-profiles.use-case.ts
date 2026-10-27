import type { AgencyProfile } from '../../types/agency-profile'
import type { DirectoryPage, DirectoryQuery } from '../../types/directory'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'

export class ListAgencyProfilesUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  execute(query: DirectoryQuery): Promise<DirectoryPage<AgencyProfile>> {
    return this.agencyProfileRepository.listPublished(query)
  }
}
