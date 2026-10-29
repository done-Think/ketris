import type { components } from '@shared/types/generated/api'

export type ApiDashboardMetrics = components['schemas']['DashboardMetrics']

export type ApiDashboardLeadStage = components['schemas']['DashboardRecentLead']['stage']

export type ApiDashboardRecentLead = components['schemas']['DashboardRecentLead']

export type ApiDashboardActivityKind = NonNullable<
  components['schemas']['DashboardUpcomingActivity']['kind']
>

export type ApiDashboardActivityProperty = components['schemas']['DashboardActivityProperty']

export type ApiDashboardUpcomingActivity = components['schemas']['DashboardUpcomingActivity']

export type ApiDashboardOverview = components['schemas']['DashboardOverviewResponse']
