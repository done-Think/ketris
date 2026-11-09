import { assertAgencyProfileAccess } from '../authorization'
import type { AgencyProfile } from '../../types/agency-profile'
import type { AgencyProfileRepository } from '../ports/agency-profile-repository.port'
import type { SaveAgencyProfileInput } from '../../types/use-case-inputs'

export class SaveAgencyProfileUseCase {
  constructor(private readonly agencyProfileRepository: AgencyProfileRepository) {}

  async execute(input: SaveAgencyProfileInput): Promise<AgencyProfile> {
    assertAgencyProfileAccess(input.actorRole)

    return this.agencyProfileRepository.save(
      input.actorTenantId,
      {
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
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        logoUrl: input.logoUrl,
        bannerUrl: input.bannerUrl,
        team: input.team,
      },
      input.actorId,
    )
  }
}
