export type PlatformTenantPlan = 'starter' | 'pro' | 'enterprise'

export type PlatformTenantStatus = 'active' | 'trial' | 'suspended'

export interface PlatformTenant {
  id: string
  name: string
  plan: PlatformTenantPlan
  brokers: number
  properties: number
  mrr: number
  status: PlatformTenantStatus
  createdAt: string
}

export interface PlatformTenantMetric {
  id: PlatformTenantPlan | 'total'
  value: string
}

export interface PlatformTenantEditDialogProps {
  tenant: PlatformTenant
  onClose: () => void
  onSave: (tenant: PlatformTenant) => void
}
