import '@server/openapi/zod-extend'
import { z } from 'zod'

import { propertyPurposeSchema, publicPropertySummarySchema } from './property.schema'

export const DEFAULT_SEARCH_PAGE_SIZE = 12
export const MAX_SEARCH_PAGE_SIZE = 50

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
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_SEARCH_PAGE_SIZE)
      .default(DEFAULT_SEARCH_PAGE_SIZE),
  })
  .openapi('SearchPropertiesQuery')

export const searchPropertiesResponseSchema = z
  .object({
    properties: z.array(publicPropertySummarySchema),
    totalCount: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  })
  .openapi('SearchPropertiesResponse')
