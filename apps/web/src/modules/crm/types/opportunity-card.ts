import type { Opportunity } from './opportunity'
import type { PublicPropertySummary } from './property'

export type OpportunityCardProps = {
  opportunity: Opportunity
  property?: PublicPropertySummary
  density?: 'regular' | 'compact'
  presentation?: {
    indicatorColor?: string
    indicatorLabel?: string
    relativeDateLabel?: string
  }
}
