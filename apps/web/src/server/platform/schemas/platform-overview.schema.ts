import '@server/openapi/zod-extend'
import { z } from 'zod'

export const platformOverviewMetricsSchema = z
  .object({
    tenantsCount: z.number().int(),
    brokersCount: z.number().int(),
    propertiesCount: z.number().int(),
    mrr: z.number().openapi({
      description: 'Soma das mensalidades das contas ACTIVE, em BRL (igual a /platform/finance).',
      example: 1499.89,
    }),
    churnRate: z
      .number()
      .nullable()
      .openapi({
        description:
          'Fração (0–1) das contas pagantes (ACTIVE) às 00:00 do dia 1 do mês (fuso ' +
          'America/Sao_Paulo) que cancelaram no mês, pelo histórico de situações. null sem base.',
        example: 0.025,
      }),
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
