import type {
  ListOpportunityActivitiesInput,
  ListOpportunityActivitiesOutput,
} from '../../types/list-opportunity-activities.use-case.types'
export type {
  ListOpportunityActivitiesInput,
  ListOpportunityActivitiesOutput,
} from '../../types/list-opportunity-activities.use-case.types'

import { OpportunityNotFoundError } from '../../domain/errors'
import { assertOpportunityAccess, assertCrmAccess } from '../authorization'
import type { ActivityRepository } from '../ports/activity-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class ListOpportunityActivitiesUseCase {
  constructor(
    private readonly opportunityRepository: OpportunityRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async execute(input: ListOpportunityActivitiesInput): Promise<ListOpportunityActivitiesOutput> {
    assertCrmAccess(input.actorRole)
    const opportunity = await this.opportunityRepository.findById(input.opportunityId)

    if (!opportunity || opportunity.tenantId !== input.actorTenantId) {
      throw new OpportunityNotFoundError()
    }

    assertOpportunityAccess(opportunity, input.actorId, input.actorRole)

    return this.activityRepository.findManyByOpportunity(opportunity.id)
  }
}
