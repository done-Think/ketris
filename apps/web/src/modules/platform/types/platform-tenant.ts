export type PlatformTenantPlan = 'starter' | 'pro' | 'enterprise'

export type PlatformTenantStatus = 'active' | 'trial' | 'suspended'

export interface PlatformTenant {
  id: string
  name: string
  plan: PlatformTenantPlan
  brokers: number
  properties: number
  mrr: string
  status: PlatformTenantStatus
  createdAt: string
}

export interface PlatformTenantMetric {
  id: PlatformTenantPlan | 'total'
  value: string
}
