export type OwnerMetricId =
  'active-properties' | 'pending-proposals' | 'weekly-visits' | 'potential-revenue'

export type OwnerMobileSummary = {
  dateLabel: string
  totalProperties: number
  activeProperties: number
  pausedProperties: number
}

export type OwnerDashboardMetric = {
  id: OwnerMetricId
  label: string
  value: string
  caption: string
  badge?: string
  trend?: string
}

export type OwnerProposalStatus = 'new' | 'accepted'

export type OwnerRecentProposal = {
  id: string
  property: string
  proponent: string
  value: string
  date: string
  status: OwnerProposalStatus
  mobileProperty?: string
  mobileDate?: string
  mobileVisible?: boolean
}

export type OwnerUpcomingVisit = {
  id: string
  date: string
  time: string
  property: string
  visitor: string
  status: 'Confirmada'
  mobileDate?: string
  mobileVisible?: boolean
}

export type OwnerWeeklyPerformance = {
  value: string
  caption: string
  points: readonly number[]
}

export type OwnerQuickActionId =
  'list-property' | 'generate-report' | 'configure-alerts' | 'support'

export type OwnerQuickAction = {
  id: OwnerQuickActionId
  label: string
  href: string
}

export type OwnerNavigationItem = {
  id: 'panel' | 'properties' | 'proposals' | 'visits' | 'financial' | 'documents'
  label: string
  href?: string
  exact?: boolean
  disabled?: boolean
}
