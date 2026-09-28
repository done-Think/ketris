import type { Papel } from '@server/auth/domain/user.entity'

import { assertBrokerProfileAccess } from '../authorization'
import type { BrokerProfile, BrokerProfileDraft } from '../../domain/broker-profile.entity'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'

export interface SaveBrokerProfileInput extends BrokerProfileDraft {
  actorId: string
  actorPapel: Papel
}

export class SaveBrokerProfileUseCase {
  constructor(private readonly brokerProfileRepository: BrokerProfileRepository) {}

  async execute(input: SaveBrokerProfileInput): Promise<BrokerProfile> {
    assertBrokerProfileAccess(input.actorPapel)

    return this.brokerProfileRepository.save(input.actorId, {
      displayName: input.displayName,
      headline: input.headline,
      bio: input.bio,
      creci: input.creci,
      phone: input.phone,
      region: input.region,
      neighborhoods: input.neighborhoods,
      specialties: input.specialties,
      availability: input.availability,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      backgroundColor: input.backgroundColor,
      avatarUrl: input.avatarUrl,
      bannerUrl: input.bannerUrl,
    })
  }
}
