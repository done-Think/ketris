import type { DashboardOverviewView } from '../types/dashboard-overview'
import type { ApiDashboardOverview } from '../types/service'
import { toDashboardUpcomingActivity } from './map-dashboard-activity'
import { toDashboardRecentLead } from './map-dashboard-recent-lead'

export function toDashboardOverviewView(overview: ApiDashboardOverview): DashboardOverviewView {
  return {
    metrics: overview.metrics,
    recentLeads: overview.recentLeads.map(toDashboardRecentLead),
    upcomingActivities: overview.upcomingActivities.map(toDashboardUpcomingActivity),
  }
}
