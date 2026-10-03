import type { Papel } from '@server/auth/domain/user.entity'

import { assertBrokerProfileAccess } from '../authorization'
import { BrokerProfileNotFoundError, ProfilePublishValidationError } from '../../domain/errors'
import type { BrokerProfile } from '../../domain/broker-profile.entity'
import type { BrokerProfileRepository } from '../ports/broker-profile-repository.port'

export interface PublishBrokerProfileInput {
  actorId: string
  actorPapel: Papel
}

function getPublishMissingFields(profile: BrokerProfile): string[] {
  const missingFields: string[] = []

  if (!profile.displayName.trim()) missingFields.push('displayName')
  if (!profile.phone?.trim()) missingFields.push('phone')
  if (!profile.bio?.trim()) missingFields.push('bio')

  return missingFields
}

export class PublishBrokerProfileUseCase {
  constructor(private readonly brokerProfileRepository: BrokerProfileRepository) {}

  async execute(input: PublishBrokerProfileInput): Promise<BrokerProfile> {
    assertBrokerProfileAccess(input.actorPapel)

    const profile = await this.brokerProfileRepository.findByUsuarioId(input.actorId)

    if (!profile) {
      throw new BrokerProfileNotFoundError()
    }

    const missingFields = getPublishMissingFields(profile)

    if (missingFields.length > 0) {
      throw new ProfilePublishValidationError(missingFields)
    }

    const published = await this.brokerProfileRepository.setStatus(
      input.actorId,
      'PUBLISHED',
      new Date(),
    )

    if (!published) {
      throw new BrokerProfileNotFoundError()
    }

    return published
  }
}
