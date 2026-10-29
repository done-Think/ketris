import type { UserRole } from '@server/auth/domain/user.entity'
import type { Opportunity } from '../domain/opportunity.entity'

export interface GetOpportunityInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  opportunityId: string
}

export type GetOpportunityOutput = Opportunity
