import type { components } from '@shared/types/generated/api'
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

export type ApiPlatformOverviewMetrics = components['schemas']['PlatformOverviewMetrics']

export type ApiPlatformGrowthMonth = components['schemas']['PlatformGrowthMonth']

export type ApiPlatformRecentTenant = components['schemas']['PlatformRecentTenant']

export type ApiPlatformOverview = components['schemas']['PlatformOverviewResponse']
