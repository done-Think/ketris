import type { ReactNode } from 'react'

export type DashboardMetric = {
  label: string
  value: string
  caption: string
  tone?: 'success' | 'danger'
}

export type DashboardActivityAccent = 'magenta' | 'info' | 'warning'

export type DashboardUpcomingActivity = {
  id: string
  time: string
  title: string
  contact: string
  accent: DashboardActivityAccent
  type: 'visit' | 'meeting' | 'follow-up'
  client: {
    name: string
    phone: string
  }
  location: {
    name: string
    address: string
    latitude: number
    longitude: number
    directionsUrl: string
  }
  meetingTime: string
  notes: string
  property?: {
    title: string
    imageUrl: string
    address: string
    price: string
    area: string
    bedrooms: string
    summary: string
    owner: {
      name: string
      phone: string
    }
  }
}

export type DashboardPerformancePoint = {
  month: string
  value: number
}

export type DashboardRecentLeadStatus = 'new' | 'inProgress' | 'qualified' | 'pending'

export type DashboardStatusStyle = {
  label: string
  bgcolor: string
  color: string
}

export type DashboardRecentLead = {
  id: string
  name: string
  phone: string
  interest: string
  status: DashboardRecentLeadStatus
  origin: string
  reportedNeed: string
  lookingFor: string
  budgetRange: string
  downPayment: string
  financingStatus: string
  desiredRegions: string[]
  timeline: string
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
  onClose: () => void
}

export type LeadDetailsModalProps = {
  lead: DashboardRecentLead | null
  onClose: () => void
  onLeadUpdate: (leadId: string, values: DashboardLeadDetailsFormValues) => void
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
  onActivitySelect: (activity: DashboardUpcomingActivity) => void
}

export type DashboardLeadDetailsFormValues = Pick<
  DashboardRecentLead,
  | 'reportedNeed'
  | 'lookingFor'
  | 'budgetRange'
  | 'downPayment'
  | 'financingStatus'
  | 'timeline'
  | 'notes'
>

export type DashboardStoreState = {
  leads: DashboardRecentLead[]
  updateLeadDetails: (leadId: string, values: DashboardLeadDetailsFormValues) => void
}
