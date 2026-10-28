import type { OpportunityStatus } from './opportunity'

export type OpportunityStage = {
  status: OpportunityStatus
  labelKey: 'draft' | 'sent' | 'negotiation' | 'accepted' | 'rejected'
  color: string
  softColor: string
}
