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
  })
  .openapi('PlatformTenant')
