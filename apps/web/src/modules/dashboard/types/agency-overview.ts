export type AgencyOverviewKpiTone = 'success' | 'neutral' | 'warning'

export type AgencyOverviewKpiHelper = {
  key: TranslationKey<'dashboard.agencyOverview.kpis.helpers'>
  values?: Record<string, number>
}

export type AgencyOverviewKpi = {
  id: string
  labelKey: TranslationKey<'dashboard.agencyOverview.kpis'>
  value: string
  helper?: AgencyOverviewKpiHelper
  tone: AgencyOverviewKpiTone
  progress?: number
}

export type KpiComparison = Pick<AgencyOverviewKpi, 'helper' | 'tone'>

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
  hasPublicProfile: boolean
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

export type AgencyOverviewView = {
  kpis: AgencyOverviewKpi[]
  revenuePoints: AgencyRevenuePoint[]
  topBrokers: AgencyTopBroker[]
  activities: AgencyActivity[]
}

export type ChartLegendDotProps = {
  color: string
  label: string
}
import type { TranslationKey } from '@/i18n/types/messages.types'
