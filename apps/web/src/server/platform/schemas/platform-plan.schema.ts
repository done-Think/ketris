import '@server/openapi/zod-extend'
import { z } from 'zod'

import { tenantAccountTypeSchema } from './tenant.schema'

const moneySchema = z
  .number()
  .min(0, 'O valor não pode ser negativo.')
  .max(999_999.99, 'Valor muito alto.')
  .multipleOf(0.01, 'Use no máximo duas casas decimais.')

export const platformPlanSchema = z
  .object({
    accountType: tenantAccountTypeSchema,
    usageUnit: z.enum(['PROPERTIES', 'BROKERS']),
    monthlyPrice: z.number().openapi({ example: 99.99 }),
    includedUnits: z.number().int().openapi({ example: 10 }),
    extraUnitPrice: z.number().openapi({ example: 9.99 }),
    activeAccounts: z.number().int().openapi({ description: 'Contas ativas neste plano.' }),
    updatedAt: z.string().openapi({ description: 'ISO 8601' }),
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
      .int('Use um número inteiro.')
      .min(0, 'O limite não pode ser negativo.')
      .max(100_000, 'Limite muito alto.')
      .openapi({ description: 'Imóveis ou corretores incluídos no preço.', example: 10 }),
    extraUnitPrice: moneySchema.openapi({
      description: 'Valor em BRL por unidade acima do limite.',
      example: 9.99,
    }),
  })
  .openapi('UpdatePlatformPlanRequest')

export type UpdatePlatformPlanRequestDTO = z.infer<typeof updatePlatformPlanRequestSchema>

export const updatePlatformPlanResponseSchema = z
  .object({ plan: platformPlanSchema.omit({ activeAccounts: true }) })
  .openapi('UpdatePlatformPlanResponse')
