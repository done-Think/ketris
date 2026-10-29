import type { z } from 'zod'
import type {
  crmPropertyDetailSchema,
  crmPropertyPageSchema,
  crmPropertyQuerySchema,
  crmPropertySummarySchema,
} from '../schemas/property.schema'

export type CrmPropertySummary = z.infer<typeof crmPropertySummarySchema>
export type CrmPropertyDetail = z.infer<typeof crmPropertyDetailSchema>
export type CrmPropertyFilters = z.infer<typeof crmPropertyQuerySchema>
export type CrmPropertyPage = z.infer<typeof crmPropertyPageSchema>

export type CrmPropertyResponse = z.infer<
  typeof import('../schemas/property.schema').crmPropertyResponseSchema
>
