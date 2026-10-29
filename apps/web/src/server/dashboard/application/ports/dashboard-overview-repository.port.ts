import type { TimeRange } from '@server/shared/types/time-zone-calendar'

import type {
  DashboardRecentLead,
  DashboardScope,
  DashboardUpcomingActivity,
} from '../../types/dashboard-overview'

export interface DashboardOverviewRepository {
  countActiveLeads(scope: DashboardScope, createdIn?: TimeRange): Promise<number>
  countVisits(scope: DashboardScope, startsIn: TimeRange): Promise<number>
  countOpenProposals(scope: DashboardScope, onlyAwaitingResponse: boolean): Promise<number>
  findRecentLeads(scope: DashboardScope, limit: number): Promise<DashboardRecentLead[]>
  findUpcomingActivities(
    scope: DashboardScope,
    from: Date,
    limit: number,
  ): Promise<DashboardUpcomingActivity[]>
}
