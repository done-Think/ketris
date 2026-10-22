import type { PlatformOverview } from '../../domain/platform-overview.entity'

export type PlatformOverviewCounts = Omit<PlatformOverview, 'metrics'> & {
  metrics: Omit<PlatformOverview['metrics'], 'mrr' | 'churnRate'>
}

export interface PlatformOverviewRepository {
  getOverview(referenceDate: Date): Promise<PlatformOverviewCounts>
}
