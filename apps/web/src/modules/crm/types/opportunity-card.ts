import type { Opportunity } from './opportunity'
import type { CrmPropertySummary } from './property'

export type OpportunityCardProps = {
  opportunity: Opportunity
  property?: CrmPropertySummary
  density?: 'regular' | 'compact'
  presentation?: {
    indicatorColor?: string
    indicatorLabel?: string
    relativeDateLabel?: string
  }
}
