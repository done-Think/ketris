import type { ReactNode } from 'react'

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

export type DashboardPerformancePoint = {
  month: string
  value: number
}

export type DashboardPerformanceChartProps = {
  data: DashboardPerformancePoint[]
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
  source: string
  status: DashboardRecentLeadStatus
  notes: string
}

export type DashboardPanelProps = {
  children: ReactNode
}

export type ContactInfoCardProps = {
  label: string
  name: string
  phone: string
}

export type ActivityDetailModalProps = {
  activity: DashboardUpcomingActivity | null
  tenantId: string | null | undefined
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
