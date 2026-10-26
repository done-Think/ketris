import { toPublicBrokerProfile } from '../../domain/broker-profile.entity'
import type { PublicBrokerProfile } from '../../types/broker-profile'
import type {
  ListPublicProfilesInput,
  ListPublicProfilesOutput,
} from '../../types/profile-directory'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'

export class ListBrokerProfilesUseCase {
  constructor(private readonly brokerProfileRepository: BrokerProfileRepository) {}

  async execute({
    page,
    pageSize,
    ...filters
  }: ListPublicProfilesInput): Promise<ListPublicProfilesOutput<PublicBrokerProfile>> {
    const result = await this.brokerProfileRepository.listPublished(filters, { page, pageSize })

    return {
      items: result.items.map(toPublicBrokerProfile),
      totalCount: result.totalCount,
      page,
      pageSize,
    }
  }
}
