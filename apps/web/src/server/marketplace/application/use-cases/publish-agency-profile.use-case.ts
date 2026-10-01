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
  if (!profile.legalCreci?.trim()) missingFields.push('legalCreci')
  if (!profile.headline?.trim()) missingFields.push('headline')
  if (!profile.headquarters?.trim()) missingFields.push('headquarters')
  if (!profile.address?.trim()) missingFields.push('address')
  if (!profile.coverage.length) missingFields.push('coverage')
  if (!profile.segments.length) missingFields.push('segments')
  if (profile.yearsInMarket === null) missingFields.push('yearsInMarket')
  if (!profile.backgroundColor?.trim()) missingFields.push('backgroundColor')
  if (!profile.logoUrl?.trim()) missingFields.push('logoUrl')
  if (!profile.bannerUrl?.trim()) missingFields.push('bannerUrl')
  if (!profile.team.length) missingFields.push('team')

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
