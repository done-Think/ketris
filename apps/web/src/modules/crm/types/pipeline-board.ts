import type { OpportunityStatus } from './opportunity'

export type PipelineBoardProps = {
  initialStatus?: OpportunityStatus | null
  titleKey?: 'title' | 'proposalsTitle'
}
