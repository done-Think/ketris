import type { opportunityResponseActions } from '@shared/config/opportunity-response-actions'

export type OpportunityResponseAction = (typeof opportunityResponseActions)[number]
