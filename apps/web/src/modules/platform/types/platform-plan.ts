import type { z } from 'zod'

import type { createPlatformPlanSchema } from '../schemas/platform-plan-schema'
import type { TenantAccountType } from './tenant'

// What the included units of a plan count: properties for individuals and brokers, active brokers
// for agencies.
export type PlanUsageUnit = 'PROPERTIES' | 'BROKERS'

export interface ApiPlatformPlan {
  accountType: TenantAccountType
  usageUnit: PlanUsageUnit
  monthlyPrice: number
  includedUnits: number
  extraUnitPrice: number
  activeAccounts: number
  updatedAt: string
}

export interface ListPlatformPlansResponse {
  plans: ApiPlatformPlan[]
}

export interface UpdatePlatformPlanPayload {
  monthlyPrice: number
  includedUnits: number
  extraUnitPrice: number
}

export interface UpdatePlatformPlanResponse {
  plan: Omit<ApiPlatformPlan, 'activeAccounts'>
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

export type PlatformPlanFormValues = z.infer<ReturnType<typeof createPlatformPlanSchema>>

export interface EditPlatformPlanDialogProps {
  plan: ApiPlatformPlan
  onClose: () => void
}
