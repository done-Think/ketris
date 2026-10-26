import type { Papel } from '@server/auth/domain/user.entity'
import type { Opportunity, OpportunityUpdate } from '../domain/opportunity.entity'

export interface UpdateOpportunityInput {
  actorTenantId: string
  actorId?: string | null
  actorPapel: Papel
  actorName?: string | null
  opportunityId: string
  changes: OpportunityUpdate
}

export type UpdateOpportunityOutput = Opportunity
