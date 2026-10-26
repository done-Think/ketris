import type { Papel } from '@server/auth/domain/user.entity'
import type { OpportunityActivity } from '../domain/activity.entity'

export interface ListOpportunityActivitiesInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  opportunityId: string
}

export type ListOpportunityActivitiesOutput = OpportunityActivity[]
