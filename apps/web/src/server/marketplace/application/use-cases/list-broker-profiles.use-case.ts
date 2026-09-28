import { toPublicBrokerProfile, type PublicBrokerProfile } from '../../domain/broker-profile.entity'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'

export class ListBrokerProfilesUseCase {
  constructor(private readonly brokerProfileRepository: BrokerProfileRepository) {}

  async execute(): Promise<PublicBrokerProfile[]> {
    const profiles = await this.brokerProfileRepository.listPublished()

    return profiles.map(toPublicBrokerProfile)
  }
}
