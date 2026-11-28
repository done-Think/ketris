import type { propertyNegotiationConditions } from '@shared/config/property-negotiation'

export type PropertyNegotiationCondition = (typeof propertyNegotiationConditions)[number]

export interface PropertyNegotiationSummaryProps {
  conditions?: readonly PropertyNegotiationCondition[]
  observation?: string | null
}
