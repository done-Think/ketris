import type { AgencyProfile } from '../../types/agency-profile'
import type {
  ListPublicProfilesInput,
  ListPublicProfilesOutput,
} from '../../types/profile-directory'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'

export class ListAgencyProfilesUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute({
    page,
    pageSize,
    ...filters
  }: ListPublicProfilesInput): Promise<ListPublicProfilesOutput<AgencyProfile>> {
    const result = await this.agencyProfileRepository.listPublished(filters, { page, pageSize })

    return { ...result, page, pageSize }
  }
}
