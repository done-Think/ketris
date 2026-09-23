import type { Papel } from '@server/auth/domain/user.entity'

import { assertAgencyProfileAccess } from '../authorization'
import { AgencyProfileNotFoundError, ProfilePublishValidationError } from '../../domain/errors'
import type { AgencyProfile } from '../../domain/agency-profile.entity'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'

export interface PublishAgencyProfileInput {
  actorTenantId: string
  actorPapel: Papel
}

function getPublishMissingFields(profile: AgencyProfile): string[] {
  const missingFields: string[] = []

  if (!profile.displayName.trim()) missingFields.push('displayName')
  if (!profile.phone?.trim() && !profile.email?.trim()) missingFields.push('phone_ou_email')
  if (!profile.summary?.trim()) missingFields.push('summary')

  return missingFields
}

export class PublishAgencyProfileUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(input: PublishAgencyProfileInput): Promise<AgencyProfile> {
    assertAgencyProfileAccess(input.actorPapel)

    const profile = await this.agencyProfileRepository.findByTenantId(input.actorTenantId)

    if (!profile) {
      throw new AgencyProfileNotFoundError()
    }

    const missingFields = getPublishMissingFields(profile)

    if (missingFields.length > 0) {
      throw new ProfilePublishValidationError(missingFields)
    }

    const published = await this.agencyProfileRepository.setStatus(
      input.actorTenantId,
      'PUBLISHED',
      new Date(),
    )

    if (!published) {
      throw new AgencyProfileNotFoundError()
    }

    return published
  }
}
