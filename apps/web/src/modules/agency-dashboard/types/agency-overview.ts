import type { SvgIconComponent } from '@mui/icons-material'

export type AgencyOverviewKpiTone = 'success' | 'neutral' | 'warning'

export type AgencyOverviewKpi = {
  id: string
  labelKey: string
  value: string
  helper: string
  tone: AgencyOverviewKpiTone
  progress?: number
}

export type AgencyRevenuePoint = {
  month: string
  revenue: number
}

export type AgencyBrokerRecentSale = {
  id: string
  propertyId: string
  property: string
  location: string | null
  value: string
  closedAt: string
}

export type AgencyTopBroker = {
  id: string
  name: string
  profileId: string
  sales: number
  revenue: string
  avatarUrl?: string | null
  recentSales: readonly AgencyBrokerRecentSale[]
}

export type AgencyBrokerDetailDialogProps = {
  broker: AgencyTopBroker | null
  onClose: () => void
}

export type AgencyActivityTone = 'contract' | 'property' | 'visit' | 'lead'

export type AgencyActivity = {
  id: string
  broker: string
  detail: string
  occurredAtLabel: string
  tone: AgencyActivityTone
}

export type AgencyActivityDetailDialogProps = {
  activity: AgencyActivity | null
  onClose: () => void
}

export type AgencyActivityDetailField = {
  label: string
  value: string
}

export type AgencySidebarNavItem = {
  id: string
  labelKey: string
  icon: SvgIconComponent
}

export type AgencyOverviewKpiGridProps = {
  kpis: readonly AgencyOverviewKpi[]
}

export type AgencyRevenuePerformancePanelProps = {
  revenuePoints: readonly AgencyRevenuePoint[]
}

export type AgencyTopBrokersPanelProps = {
  topBrokers: readonly AgencyTopBroker[]
}

export type AgencyRecentActivityPanelProps = {
  activities: readonly AgencyActivity[]
}
