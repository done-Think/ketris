import type { LeadSource } from '@shared/types/lead-source'
import type { ReactNode } from 'react'

import type { ApiDashboardMetrics } from './service'

export type DashboardActivityProperty = {
  title: string
  address: string | null
  price: number
}

export type DashboardMetricTone = 'success' | 'danger'

export type DashboardMetric = {
  label: string
  value: string
  caption?: string
  tone?: DashboardMetricTone
}

export type DashboardMetricGridProps = {
  metrics: DashboardMetric[]
}

export type BuildDashboardMetricsParams = {
  metrics: ApiDashboardMetrics
  t: (key: TranslationKey<'dashboard.overview'>, values?: Record<string, string | number>) => string
}

export type DashboardActivityAccent = 'magenta' | 'info' | 'warning'

export type DashboardUpcomingActivity = {
  id: string
  time: string
  title: string
  contact: string
  phone: string
  accent: DashboardActivityAccent
  meetingTime: string
  notes: string
  propertyId: string | null
  propertyReference: string | null
  property: DashboardActivityProperty | null
}

export type DashboardRecentLeadStatus = 'new' | 'inProgress' | 'qualified' | 'pending'

export type DashboardStatusStyle = {
  bgcolor: string
  color: string
}

export type DashboardRecentLead = {
  id: string
  name: string
  phone: string
  interest: string
  budget: string
  source: LeadSource
  status: DashboardRecentLeadStatus
  notes: string
}

export type DashboardOverviewView = {
  metrics: ApiDashboardMetrics
  recentLeads: DashboardRecentLead[]
  upcomingActivities: DashboardUpcomingActivity[]
}

export type ContactInfoCardProps = {
  label: string
  name: string
  phone: string
}

export type ActivityDetailModalProps = {
  activity: DashboardUpcomingActivity | null
  onClose: () => void
}

export type LeadDetailsModalProps = {
  lead: DashboardRecentLead | null
  onClose: () => void
}

export type LeadBriefingItemProps = {
  label: string
  value: ReactNode
}

export type RecentLeadsTableProps = {
  leads: DashboardRecentLead[]
  onLeadSelect: (lead: DashboardRecentLead) => void
}

export type UpcomingActivitiesPanelProps = {
  activities: DashboardUpcomingActivity[]
  onActivitySelect: (activity: DashboardUpcomingActivity) => void
}
import type { TranslationKey } from '@/i18n/types/messages.types'
