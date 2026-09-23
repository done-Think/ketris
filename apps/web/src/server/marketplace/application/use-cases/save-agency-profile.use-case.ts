import type { Papel } from '@server/auth/domain/user.entity'

import { assertAgencyProfileAccess } from '../authorization'
import type { AgencyProfile, AgencyProfileDraft } from '../../domain/agency-profile.entity'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'

export interface SaveAgencyProfileInput extends AgencyProfileDraft {
  actorTenantId: string
  actorPapel: Papel
}

export class SaveAgencyProfileUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(input: SaveAgencyProfileInput): Promise<AgencyProfile> {
    assertAgencyProfileAccess(input.actorPapel)

    return this.agencyProfileRepository.save(input.actorTenantId, {
      displayName: input.displayName,
      headline: input.headline,
      summary: input.summary,
      legalCreci: input.legalCreci,
      headquarters: input.headquarters,
      address: input.address,
      phone: input.phone,
      email: input.email,
      coverage: input.coverage,
      segments: input.segments,
      yearsInMarket: input.yearsInMarket,
      backgroundColor: input.backgroundColor,
      logoUrl: input.logoUrl,
      bannerUrl: input.bannerUrl,
      team: input.team,
    })
  }
}
