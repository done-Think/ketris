import type {
  ApiPlatformGrowthMonth,
  ApiPlatformOverview,
  ApiPlatformRecentTenant,
  GrowthTrendPoint,
  PlatformMetric,
  RecentTenant,
} from '../types/platform-overview'

const monthKeys = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]

export function mapPlatformMetricsToCards(
  metrics: ApiPlatformOverview['metrics'],
): PlatformMetric[] {
  return [
    { id: 'tenants', value: metrics.tenantsCount, format: 'number' },
    { id: 'brokers', value: metrics.brokersCount, format: 'number' },
    { id: 'properties', value: metrics.propertiesCount, format: 'compactNumber' },
    { id: 'mrr', value: metrics.mrr, format: 'compactCurrency' },
    { id: 'churn', value: metrics.churnRate, format: 'percent' },
  ]
}

export function mapGrowthTrend(growthTrend: ApiPlatformGrowthMonth[]): GrowthTrendPoint[] {
  return growthTrend.map((entry) => ({
    month: monthKeys[entry.month - 1] ?? String(entry.month),
    tenants: entry.tenants,
    contracts: entry.contracts,
  }))
}

export function mapRecentTenants(recentTenants: ApiPlatformRecentTenant[]): RecentTenant[] {
  return recentTenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    brokers: tenant.brokersCount,
    properties: tenant.propertiesCount,
    registeredAt: tenant.createdAt,
  }))
}
