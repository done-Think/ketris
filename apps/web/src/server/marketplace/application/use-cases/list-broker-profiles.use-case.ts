import { toPublicBrokerProfile } from '../../domain/broker-profile.entity'
import type { PublicBrokerProfile } from '../../types/broker-profile'
import type { DirectoryPage, DirectoryQuery } from '../../types/directory'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'

export class ListBrokerProfilesUseCase {
  constructor(private readonly brokerProfileRepository: BrokerProfileRepository) {}

  async execute(query: DirectoryQuery): Promise<DirectoryPage<PublicBrokerProfile>> {
    const result = await this.brokerProfileRepository.listPublished(query)

    return { ...result, items: result.items.map(toPublicBrokerProfile) }
  }
}
