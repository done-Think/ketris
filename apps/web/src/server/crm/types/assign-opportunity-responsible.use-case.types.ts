import type { UserRole } from '@server/auth/domain/user.entity'
import type { Opportunity } from '../domain/opportunity.entity'

export interface AssignOpportunityResponsibleInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  actorName?: string | null
  opportunityId: string
  responsibleId: string
}

export type AssignOpportunityResponsibleOutput = Opportunity
