import type { PlatformOverviewCounts } from '../../types/platform-overview-repository'

export interface PlatformOverviewRepository {
  getOverview(referenceDate: Date): Promise<PlatformOverviewCounts>
}
