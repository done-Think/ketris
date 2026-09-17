import '@server/openapi/zod-extend'
import { z } from 'zod'

import { propertyPurposeSchema, publicPropertySummarySchema } from './property.schema'

export const propertySortSchema = z.enum(['recent', 'priceAsc', 'priceDesc'])

export const searchPropertiesQuerySchema = z
  .object({
    purpose: propertyPurposeSchema.optional(),
    propertyType: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    minBedrooms: z.coerce.number().int().nonnegative().optional(),
    minArea: z.coerce.number().nonnegative().optional(),
    hasParking: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    sortBy: propertySortSchema.optional(),
    q: z.string().min(1).optional(),
  })
  .openapi('SearchPropertiesQuery')

export type SearchPropertiesQueryDTO = z.infer<typeof searchPropertiesQuerySchema>

export const searchPropertiesResponseSchema = z
  .object({
    properties: z.array(publicPropertySummarySchema),
  })
  .openapi('SearchPropertiesResponse')
