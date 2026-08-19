import type { z } from 'zod'

import type {
  publicPropertyAddressSchema,
  publicPropertyDetailSchema,
  publicPropertyMediaSchema,
  publicPropertyPurposeSchema,
  publicPropertySearchFiltersSchema,
  publicPropertySummarySchema,
} from '../schemas/property-schema'

export type PublicPropertyPurpose = z.infer<typeof publicPropertyPurposeSchema>
export type PublicPropertySearchFilters = z.infer<typeof publicPropertySearchFiltersSchema>
export type PublicPropertySummary = z.infer<typeof publicPropertySummarySchema>
export type PublicPropertyAddress = z.infer<typeof publicPropertyAddressSchema>
export type PublicPropertyMedia = z.infer<typeof publicPropertyMediaSchema>
export type PublicPropertyDetail = z.infer<typeof publicPropertyDetailSchema>
