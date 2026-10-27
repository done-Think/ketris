export type PlatformMetricTone = 'success' | 'neutral'

export interface PlatformMetric {
  id: 'tenants' | 'brokers' | 'properties' | 'mrr' | 'churn'
  value: number | null
  format: 'number' | 'compactNumber' | 'compactCurrency' | 'percent'
  tone?: PlatformMetricTone
}

export interface GrowthTrendPoint extends Record<string, string | number> {
  month: string
  tenants: number
  contracts: number
}

export interface RecentTenant {
  id: string
  name: string
  brokers: number
  properties: number
  registeredAt: string
}

export interface ApiPlatformOverviewMetrics {
  tenantsCount: number
  brokersCount: number
  propertiesCount: number
  mrr: number
  churnRate: number | null
}

export interface ApiPlatformGrowthMonth {
  year: number
  month: number
  tenants: number
  contracts: number
}

export interface ApiPlatformRecentTenant {
  id: string
  name: string
  brokersCount: number
  propertiesCount: number
  createdAt: string
}

export interface ApiPlatformOverview {
  metrics: ApiPlatformOverviewMetrics
  growthTrend: ApiPlatformGrowthMonth[]
  recentTenants: ApiPlatformRecentTenant[]
}
