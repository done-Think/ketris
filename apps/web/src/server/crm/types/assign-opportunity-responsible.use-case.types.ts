import type { Papel } from '@server/auth/domain/user.entity'
import type { Opportunity } from '../domain/opportunity.entity'

export interface AssignOpportunityResponsibleInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  actorName?: string | null
  opportunityId: string
  responsibleId: string
}

export type AssignOpportunityResponsibleOutput = Opportunity
