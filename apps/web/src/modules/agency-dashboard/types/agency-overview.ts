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
  target: number
}

export type AgencyTopBroker = {
  id: string
  name: string
  profileId: string
  sales: number
  revenue: string
  avatarUrl?: string
  recentSales: readonly AgencyBrokerRecentSale[]
}

export type AgencyBrokerRecentSale = {
  id: string
  propertyId: string
  property: string
  location: string
  value: string
  closedAt: string
}

export type AgencyBrokerDetailDialogProps = {
  broker: AgencyTopBroker | null
  onClose: () => void
}

export type AgencyActivityTone = 'contract' | 'property' | 'visit' | 'lead'

export type AgencyActivityDetailKey =
  'contractSale' | 'newProperty' | 'visitScheduled' | 'newLead' | 'rentContract'

export type AgencyActivity = {
  id: string
  broker: string
  actionKey: string
  detail: string
  detailKey: AgencyActivityDetailKey
  timeAgo: string
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
