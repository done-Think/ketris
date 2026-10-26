import type { Papel } from '@server/auth/domain/user.entity'
import type { Opportunity } from '../domain/opportunity.entity'

export interface ArchiveOpportunityInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  opportunityId: string
}

export type ArchiveOpportunityOutput = Opportunity
