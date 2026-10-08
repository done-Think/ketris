export interface ApiAgencyOverviewKpis {
  portfolioCount: number
  activeBrokersCount: number
  receivedLeadsThisMonth: number
  monthlyReceivable: number
  occupancyPercentage: number
}

export interface ApiAgencyRevenueMonth {
  year: number
  month: number
  total: number
}

export interface ApiAgencyBrokerSale {
  id: string
  propertyId: string
  propertyTitle: string
  location: string | null
  value: number
  closedAt: string
}

export interface ApiAgencyTopBroker {
  id: string
  name: string
  avatarUrl: string | null
  salesCount: number
  revenueTotal: number
  recentSales: ApiAgencyBrokerSale[]
}

export type ApiAgencyActivityType = 'CONTRACT' | 'PROPERTY' | 'VISIT' | 'LEAD'

export interface ApiAgencyActivity {
  id: string
  type: ApiAgencyActivityType
  brokerName: string
  detail: string
  occurredAt: string
}

export interface ApiAgencyOverview {
  kpis: ApiAgencyOverviewKpis
  revenueSeries: ApiAgencyRevenueMonth[]
  topBrokers: ApiAgencyTopBroker[]
  recentActivities: ApiAgencyActivity[]
}
