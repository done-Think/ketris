export interface PlatformOverviewMetrics {
  tenantsCount: number
  brokersCount: number
  propertiesCount: number
  // Same numbers as the finance page (see summarizeBilling).
  mrr: number
  churnRate: number | null
}

export interface PlatformGrowthMonth {
  year: number
  month: number
  tenants: number
  contracts: number
}

export interface PlatformRecentTenant {
  id: string
  name: string
  brokersCount: number
  propertiesCount: number
  createdAt: Date
}

export interface PlatformOverview {
  metrics: PlatformOverviewMetrics
  growthTrend: PlatformGrowthMonth[]
  recentTenants: PlatformRecentTenant[]
}
