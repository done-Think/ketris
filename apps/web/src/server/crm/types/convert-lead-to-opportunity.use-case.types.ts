import type { UserRole } from '@server/auth/domain/user.entity'
import type { Lead } from '../domain/lead.entity'
import type { Opportunity } from '../domain/opportunity.entity'

export interface ConvertLeadToOpportunityInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  leadId: string
  propertyId: string
  proposedValue: number
  email?: string
}

export interface ConvertLeadToOpportunityOutput {
  lead: Lead
  opportunity: Opportunity
}
