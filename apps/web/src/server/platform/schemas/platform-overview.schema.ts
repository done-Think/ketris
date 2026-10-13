import '@server/openapi/zod-extend'
import { z } from 'zod'

export const platformOverviewMetricsSchema = z
  .object({
    tenantsCount: z.number().int(),
    brokersCount: z.number().int(),
    propertiesCount: z.number().int(),
  })
  .openapi('PlatformOverviewMetrics')

export const platformGrowthMonthSchema = z
  .object({
    year: z.number().int(),
    month: z.number().int(),
    tenants: z.number().int(),
    contracts: z.number().int(),
  })
  .openapi('PlatformGrowthMonth')

export const platformRecentTenantSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    brokersCount: z.number().int(),
    propertiesCount: z.number().int(),
    createdAt: z.string(),
  })
  .openapi('PlatformRecentTenant')

export const platformOverviewResponseSchema = z
  .object({
    metrics: platformOverviewMetricsSchema,
    growthTrend: z.array(platformGrowthMonthSchema),
    recentTenants: z.array(platformRecentTenantSchema),
  })
  .openapi('PlatformOverviewResponse')
