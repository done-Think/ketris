import '@server/openapi/zod-extend'
import { z } from 'zod'

import { tenantAccountTypeSchema } from './tenant.schema'

const moneySchema = z.number().min(0).max(999_999.99).multipleOf(0.01)

export const platformPlanSchema = z
  .object({
    accountType: tenantAccountTypeSchema,
    usageUnit: z.enum(['PROPERTIES', 'BROKERS']),
    monthlyPrice: z.number().openapi({ example: 99.99 }),
    includedUnits: z.number().int().openapi({ example: 10 }),
    extraUnitPrice: z.number().openapi({ example: 9.99 }),
    activeAccounts: z.number().int().openapi({ description: 'Contas ativas neste plano.' }),
    createdAt: z.string().openapi({ description: 'ISO 8601' }),
    updatedAt: z.string().openapi({ description: 'ISO 8601' }),
    updatedBy: z
      .object({ id: z.string().nullable(), name: z.string() })
      .nullable()
      .openapi({ description: 'Quem alterou os valores por último; null antes da 1ª alteração.' }),
  })
  .openapi('PlatformPlan')

export const listPlatformPlansResponseSchema = z
  .object({ plans: z.array(platformPlanSchema) })
  .openapi('ListPlatformPlansResponse')

export const updatePlatformPlanRequestSchema = z
  .object({
    monthlyPrice: moneySchema.openapi({ description: 'Preço mensal em BRL.', example: 99.99 }),
    includedUnits: z
      .number()
      .int()
      .min(0)
      .max(100_000)
      .openapi({ description: 'Imóveis ou corretores incluídos no preço.', example: 10 }),
    extraUnitPrice: moneySchema.openapi({
      description: 'Valor em BRL por unidade acima do limite.',
      example: 9.99,
    }),
  })
  .strict()
  .openapi('UpdatePlatformPlanRequest')

export const updatePlatformPlanResponseSchema = z
  .object({ plan: platformPlanSchema.omit({ activeAccounts: true }) })
  .openapi('UpdatePlatformPlanResponse')
