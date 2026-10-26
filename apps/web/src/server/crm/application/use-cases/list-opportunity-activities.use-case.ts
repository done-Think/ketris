import type {
  ListOpportunityActivitiesInput,
  ListOpportunityActivitiesOutput,
} from '../../types/list-opportunity-activities.use-case.types'
export type {
  ListOpportunityActivitiesInput,
  ListOpportunityActivitiesOutput,
} from '../../types/list-opportunity-activities.use-case.types'

import { OpportunityNotFoundError } from '../../domain/errors'
import { assertAgentOwnsProperty, assertCrmAccess } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../ports/property-lookup.port'

export class ListOpportunityActivitiesUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly propertyLookup: PropertyLookupPort,
  ) {}

  async execute(input: ListOpportunityActivitiesInput): Promise<ListOpportunityActivitiesOutput> {
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

    return this.activityRepository.findManyByOpportunity(opportunity.id)
  }
}
