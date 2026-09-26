export type PlatformMetricTone = 'success' | 'neutral'

export interface PlatformMetric {
  id: 'tenants' | 'brokers' | 'properties' | 'mrr' | 'churn' | 'uptime'
  value: number
  format: 'number' | 'compactNumber' | 'compactCurrency' | 'percent'
  indicator?: 'growth' | 'stable' | 'normal'
  tone?: PlatformMetricTone
}

export interface GrowthTrendPoint extends Record<string, string | number> {
  month: string
  tenants: number
  contracts: number
}

export type PlatformAlertTone = 'error' | 'warning' | 'info'

export interface PlatformAlert {
  id: 'backup' | 'cpu' | 'ssl' | 'tenant-registration'
  elapsedMinutes: number
  tone: PlatformAlertTone
}

export interface RecentTenant {
  id: string
  name: string
  plan: 'enterprise' | 'proGrowth' | 'starterPack'
  brokers: number
  registeredAt: string
  status: 'active' | 'provisioning' | 'suspended'
}
