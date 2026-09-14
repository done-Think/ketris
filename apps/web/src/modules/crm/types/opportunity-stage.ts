import type { OpportunityStatus } from './opportunity'

export type OpportunityStage = {
  status: OpportunityStatus
  label: string
  labelKey: string
  color: string
  softColor: string
}
