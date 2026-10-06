import type { z } from 'zod'

import type {
  createPublicPropertySearchFiltersSchema,
  publicPropertyAddressSchema,
  publicPropertyDetailSchema,
  publicPropertyMediaSchema,
  publicPropertyPurposeSchema,
  publicPropertySummarySchema,
} from '../schemas/property-schema'

export type PublicPropertyPurpose = z.infer<typeof publicPropertyPurposeSchema>
export type PublicPropertySearchFilters = z.infer<
  ReturnType<typeof createPublicPropertySearchFiltersSchema>
>
export type PublicPropertySummary = z.infer<typeof publicPropertySummarySchema>
export type PublicPropertyAddress = z.infer<typeof publicPropertyAddressSchema>
export type PublicPropertyMedia = z.infer<typeof publicPropertyMediaSchema>
export type PublicPropertyDetail = z.infer<typeof publicPropertyDetailSchema>
