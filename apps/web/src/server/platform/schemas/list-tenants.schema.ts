import '@server/openapi/zod-extend'
import { z } from 'zod'

import { platformTenantSchema, tenantAccountTypeSchema, tenantStatusSchema } from './tenant.schema'

export const DEFAULT_PLATFORM_PAGE_SIZE = 20
export const MAX_PLATFORM_PAGE_SIZE = 100

export const platformPageQueryFields = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PLATFORM_PAGE_SIZE)
    .default(DEFAULT_PLATFORM_PAGE_SIZE),
}

export const platformPageFields = {
  totalCount: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
}

export const listTenantsQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    status: tenantStatusSchema.optional(),
    accountType: tenantAccountTypeSchema.optional(),
    ...platformPageQueryFields,
  })
  .strict()
  .openapi('ListTenantsQuery')

export const listTenantsResponseSchema = z
  .object({
    tenants: z.array(platformTenantSchema),
    ...platformPageFields,
    statusCounts: z
      .object({
        TRIAL: z.number().int(),
        ACTIVE: z.number().int(),
        SUSPENDED: z.number().int(),
        CANCELED: z.number().int(),
      })
      .openapi({ description: 'Totais por situação, com a busca e o tipo aplicados.' }),
  })
  .openapi('ListTenantsResponse')

export const getTenantResponseSchema = z
  .object({ tenant: platformTenantSchema })
  .openapi('GetPlatformTenantResponse')
