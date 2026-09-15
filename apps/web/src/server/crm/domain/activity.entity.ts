import type { OpportunityStatus } from './opportunity.entity'

export type ActivityType = 'NOTA' | 'MUDANCA_STATUS' | 'CONTATO_REALIZADO' | 'PROPOSTA_RESPONDIDA'

export interface OpportunityActivity {
  id: string
  opportunityId: string
  type: ActivityType
  description: string
  authorId: string | null
  authorName: string | null
  previousStatus: OpportunityStatus | null
  newStatus: OpportunityStatus | null
  createdAt: Date
}

export interface NewOpportunityActivity {
  opportunityId: string
  type: ActivityType
  description: string
  authorId: string | null
  authorName: string | null
  previousStatus: OpportunityStatus | null
  newStatus: OpportunityStatus | null
}
