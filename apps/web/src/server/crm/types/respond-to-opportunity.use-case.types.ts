import type { UserRole } from '@server/auth/domain/user.entity'
import type { OpportunityActivity } from '../domain/activity.entity'
import { type OpportunityResponseAction } from '../domain/opportunity-status'
import type { Opportunity } from '../domain/opportunity.entity'

export interface RespondToOpportunityInput {
  actorTenantId: string
  actorId?: string | null
  actorRole: UserRole
  actorName?: string | null
  opportunityId: string
  action: OpportunityResponseAction
  message?: string | null
}

export interface RespondToOpportunityOutput {
  opportunity: Opportunity
  activity: OpportunityActivity
}
