import type { PlatformOverview } from '../../domain/platform-overview.entity'

export interface PlatformOverviewRepository {
  getOverview(referenceDate: Date): Promise<PlatformOverview>
}
