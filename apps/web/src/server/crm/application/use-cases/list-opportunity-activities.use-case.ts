import { OpportunityNotFoundError } from '../../domain/errors'
import type { OpportunityActivity } from '../../domain/activity.entity'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export interface ListOpportunityActivitiesInput {
  actorTenantId: string
  opportunityId: string
}

export type ListOpportunityActivitiesOutput = OpportunityActivity[]

export class ListOpportunityActivitiesUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(input: ListOpportunityActivitiesInput): Promise<ListOpportunityActivitiesOutput> {
    // The timeline doesn't store a tenantId: isolation comes from the opportunity that owns it.
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    return this.activityRepository.findManyByOpportunity(opportunity.id)
  }
}
