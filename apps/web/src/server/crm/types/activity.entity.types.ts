import type { OpportunityStatus } from '../domain/opportunity.entity'

export type ActivityType = 'NOTA' | 'MUDANCA_STATUS' | 'CONTATO_REALIZADO' | 'PROPOSTA_RESPONDIDA'

export interface OpportunityActivity {
  id: string
  opportunityId: string
  type: ActivityType
  systemAction?: string | null
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
  systemAction?: string | null
  description: string
  authorId: string | null
  authorName: string | null
  previousStatus: OpportunityStatus | null
  newStatus: OpportunityStatus | null
}
