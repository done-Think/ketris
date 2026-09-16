import type { Papel } from '@server/auth/domain/user.entity'

import { OpportunityNotFoundError } from '../../domain/errors'
import type { OpportunityActivity } from '../../domain/activity.entity'
import { assertAgentOwnsProperty } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'
import type { PropertyLookupPort } from '../ports/property-lookup.port'

export interface ListOpportunityActivitiesInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  opportunityId: string
}

export type ListOpportunityActivitiesOutput = OpportunityActivity[]

export class ListOpportunityActivitiesUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly propertyLookup: PropertyLookupPort,
  ) {}

  async execute(input: ListOpportunityActivitiesInput): Promise<ListOpportunityActivitiesOutput> {
    // The timeline doesn't store a tenantId: isolation comes from the opportunity that owns it.
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
