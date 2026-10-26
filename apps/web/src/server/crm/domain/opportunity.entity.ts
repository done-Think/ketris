import type { CreatedOpportunity, Opportunity } from '../types/opportunity.entity.types'
export type {
  CreatedOpportunity,
  GuaranteeType,
  NewOpportunity,
  Opportunity,
  OpportunityStatus,
  OpportunityUpdate,
} from '../types/opportunity.entity.types'

export function toCreatedOpportunity(opportunity: Opportunity): CreatedOpportunity {
  return {
    id: opportunity.id,
    propertyId: opportunity.propertyId,
    status: opportunity.status,
    createdAt: opportunity.createdAt,
  }
}
