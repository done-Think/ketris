import type { DashboardOverview } from '../types/dashboard-overview'
import type { DashboardOverviewResponse } from '../types/dashboard-overview-response'

export function toDashboardOverviewResponse(
  overview: DashboardOverview,
): DashboardOverviewResponse {
  return {
    metrics: overview.metrics,
    recentLeads: overview.recentLeads.map((lead) => ({
      ...lead,
      createdAt: lead.createdAt.toISOString(),
    })),
    upcomingActivities: overview.upcomingActivities.map((activity) => ({
      ...activity,
      start: activity.start.toISOString(),
      end: activity.end.toISOString(),
    })),
  }
}
