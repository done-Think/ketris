import type { components } from '@shared/types/generated/api'
import type { z } from 'zod'

import type { createPlatformPlanSchema } from '../schemas/platform-plan-schema'

export type PlanUsageUnit = components['schemas']['PlatformPlan']['usageUnit']

export type ApiPlatformPlan = components['schemas']['PlatformPlan']

export type ListPlatformPlansResponse = components['schemas']['ListPlatformPlansResponse']

export type UpdatePlatformPlanPayload = components['schemas']['UpdatePlatformPlanRequest']

export type UpdatePlatformPlanResponse = components['schemas']['UpdatePlatformPlanResponse']

export type MonthlyCharge = NonNullable<components['schemas']['MonthlyCharge']>

export type PlatformPlanFormValues = z.infer<ReturnType<typeof createPlatformPlanSchema>>

export interface EditPlatformPlanDialogProps {
  plan: ApiPlatformPlan
  onClose: () => void
}
