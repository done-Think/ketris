export interface AgencyOverviewKpis {
  portfolioCount: number
  activeBrokersCount: number
  receivedLeadsThisMonth: number
  monthlyReceivable: number
  occupancyPercentage: number
}

export interface AgencyRevenueMonth {
  year: number
  month: number
  total: number
}

export interface AgencyBrokerSale {
  id: string
  propertyId: string
  propertyTitle: string
  location: string | null
  value: number
  closedAt: Date
}

export interface AgencyTopBroker {
  id: string
  name: string
  avatarUrl: string | null
  salesCount: number
  revenueTotal: number
  recentSales: AgencyBrokerSale[]
}

export type AgencyActivityType = 'CONTRACT' | 'PROPERTY' | 'VISIT' | 'LEAD'

export interface AgencyActivity {
  id: string
  type: AgencyActivityType
  brokerName: string
  detail: string
  occurredAt: Date
}

export interface AgencyOverview {
  kpis: AgencyOverviewKpis
  revenueSeries: AgencyRevenueMonth[]
  topBrokers: AgencyTopBroker[]
  recentActivities: AgencyActivity[]
}
