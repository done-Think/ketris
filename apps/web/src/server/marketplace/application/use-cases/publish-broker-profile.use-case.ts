import type { Papel } from '@server/auth/domain/user.entity'

import { assertBrokerProfileAccess } from '../authorization'
import { BrokerProfileNotFoundError, ProfilePublishValidationError } from '../../domain/errors'
import type { BrokerProfile } from '../../types/broker-profile'
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
  if (!profile.creci?.trim()) missingFields.push('creci')
  if (!profile.availability?.trim()) missingFields.push('availability')
  if (!profile.headline?.trim()) missingFields.push('headline')
  if (!profile.region?.trim()) missingFields.push('region')
  if (!profile.neighborhoods.length) missingFields.push('neighborhoods')
  if (!profile.specialties.length) missingFields.push('specialties')
  if (!profile.primaryColor?.trim()) missingFields.push('primaryColor')
  if (!profile.secondaryColor?.trim()) missingFields.push('secondaryColor')
  if (!profile.backgroundColor?.trim()) missingFields.push('backgroundColor')
  if (!profile.avatarUrl?.trim()) missingFields.push('avatarUrl')
  if (!profile.bannerUrl?.trim()) missingFields.push('bannerUrl')

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
