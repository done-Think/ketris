import '@server/openapi/zod-extend'
import { z } from 'zod'

import { TENANT_ACCOUNT_TYPES, TENANT_STATUSES } from '../domain/tenant-account'

export const tenantAccountTypeSchema = z.enum(TENANT_ACCOUNT_TYPES).openapi({
  description: 'Tipo de conta: define o plano cobrado (pessoa física, corretor ou imobiliária).',
  example: 'AGENCY',
})

export const tenantStatusSchema = z.enum(TENANT_STATUSES).openapi({
  description: 'Situação da conta na plataforma. Só ACTIVE é cobrada.',
  example: 'ACTIVE',
})

export const tenantSummarySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    createdAt: z.string().openapi({ description: 'ISO 8601', example: '2026-08-04T12:00:00.000Z' }),
  })
  .openapi('TenantSummary')

export const monthlyChargeSchema = z
  .object({
    usageUnit: z.enum(['PROPERTIES', 'BROKERS']).openapi({
      description: 'O que o limite conta: imóveis (pessoa física e corretor) ou corretores ativos.',
    }),
    usage: z.number().int(),
    includedUnits: z.number().int(),
    extraUnits: z.number().int(),
    basePrice: z.number(),
    extraAmount: z.number(),
    total: z
      .number()
      .openapi({ description: 'Mensalidade em BRL: base + extras.', example: 119.97 }),
  })
  .openapi('MonthlyCharge')

export const platformTenantSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    accountType: tenantAccountTypeSchema,
    status: tenantStatusSchema,
    canceledAt: z.string().nullable().openapi({
      description: 'ISO 8601. Preenchido quando a situação passa a CANCELED.',
      example: null,
    }),
    createdAt: z.string().openapi({ description: 'ISO 8601', example: '2026-08-04T12:00:00.000Z' }),
    monthlyCharge: monthlyChargeSchema
      .nullable()
      .optional()
      .openapi({
        description:
          'Mensalidade calculada pelo plano do tipo de conta e pelo uso atual (só na listagem). ' +
          'null para o tenant de sistema dos locatários.',
      }),
  })
  .openapi('PlatformTenant')
