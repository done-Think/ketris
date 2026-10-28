import type { UserRole } from '@server/auth/domain/user.entity'
import type { Opportunity, OpportunityUpdate } from '../domain/opportunity.entity'

export interface UpdateOpportunityInput {
  actorTenantId: string
  actorId?: string | null
  actorRole: UserRole
  actorName?: string | null
  opportunityId: string
  changes: OpportunityUpdate
}

export type UpdateOpportunityOutput = Opportunity
