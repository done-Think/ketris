import '@server/openapi/zod-extend'
import { z } from 'zod'

export const marketplaceStatsResponseSchema = z
  .object({
    publishedProperties: z.number().int().nonnegative(),
    publishedBrokers: z.number().int().nonnegative(),
    servedCities: z.number().int().nonnegative(),
  })
  .openapi('MarketplaceStatsResponse')
