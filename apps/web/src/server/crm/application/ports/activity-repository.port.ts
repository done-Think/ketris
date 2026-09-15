import type { NewOpportunityActivity, OpportunityActivity } from '../../domain/activity.entity'

export interface ActivityRepository {
  create(activity: NewOpportunityActivity): Promise<OpportunityActivity>
  findManyByOpportunity(opportunityId: string): Promise<OpportunityActivity[]>
}
