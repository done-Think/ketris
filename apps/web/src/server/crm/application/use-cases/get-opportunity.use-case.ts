import type {
  GetOpportunityInput,
  GetOpportunityOutput,
} from '../../types/get-opportunity.use-case.types'
export type {
  GetOpportunityInput,
  GetOpportunityOutput,
} from '../../types/get-opportunity.use-case.types'

import { OpportunityNotFoundError } from '../../domain/errors'
import { assertAgentOwnsProperty, assertCrmAccess } from '../authorization'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../ports/property-lookup.port'

export class GetOpportunityUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly propertyLookup: PropertyLookupPort,
  ) {}

  async execute(input: GetOpportunityInput): Promise<GetOpportunityOutput> {
    assertCrmAccess(input.actorPapel)
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    await assertAgentOwnsProperty(
      this.propertyLookup,
      input.actorTenantId,
      opportunity.propertyId,
      input.actorId,
      input.actorPapel,
    )

    return opportunity
  }
}
