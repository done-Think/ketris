import type { TenantAccountType } from './tenant-account'

export type PlanUsageUnit = 'PROPERTIES' | 'BROKERS'

export interface PlatformPlan {
  accountType: TenantAccountType
  monthlyPrice: number
  includedUnits: number
  extraUnitPrice: number
  createdAt: Date
  updatedAt: Date
  updatedBy: PlatformPlanAuthor | null
}

export interface PlatformPlanAuthor {
  id: string | null
  name: string
}

export interface TenantUsage {
  properties: number
  brokers: number
}

export interface MonthlyCharge {
  usageUnit: PlanUsageUnit
  usage: number
  includedUnits: number
  extraUnits: number
  basePrice: number
  extraAmount: number
  total: number
}

export interface PlatformPlanResponse {
  accountType: TenantAccountType
  usageUnit: PlanUsageUnit
  monthlyPrice: number
  includedUnits: number
  extraUnitPrice: number
  createdAt: Date
  updatedAt: Date
  updatedBy: PlatformPlanAuthor | null
  activeAccounts?: number
}
