import type { PlatformOverview } from './platform-overview'

export type PlatformOverviewCounts = Omit<PlatformOverview, 'metrics'> & {
  metrics: Omit<PlatformOverview['metrics'], 'mrr' | 'churnRate'>
}
