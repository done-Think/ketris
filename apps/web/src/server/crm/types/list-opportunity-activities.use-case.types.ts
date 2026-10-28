import type { UserRole } from '@server/auth/domain/user.entity'
import type { OpportunityActivity } from '../domain/activity.entity'

export interface ListOpportunityActivitiesInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  opportunityId: string
}

export type ListOpportunityActivitiesOutput = OpportunityActivity[]
