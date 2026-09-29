import { BrokerProfileNotFoundError } from '../../domain/errors'
import { toPublicBrokerProfile, type PublicBrokerProfile } from '../../domain/broker-profile.entity'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'

export interface GetBrokerProfileInput {
  id: string
}

export class GetBrokerProfileUseCase {
  constructor(private readonly brokerProfileRepository: BrokerProfileRepository) {}

  async execute(input: GetBrokerProfileInput): Promise<PublicBrokerProfile> {
    const profile = await this.brokerProfileRepository.findPublishedById(input.id)

    if (!profile) {
      throw new BrokerProfileNotFoundError()
    }

    return toPublicBrokerProfile(profile)
  }
}
