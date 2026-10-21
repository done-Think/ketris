import '@server/openapi/zod-extend'
import { z } from 'zod'

import { platformTenantSchema, tenantAccountTypeSchema, tenantStatusSchema } from './tenant.schema'

export const updateTenantAccountRequestSchema = z
  .object({
    accountType: tenantAccountTypeSchema,
    status: tenantStatusSchema,
  })
  .openapi('UpdateTenantAccountRequest')

export type UpdateTenantAccountRequestDTO = z.infer<typeof updateTenantAccountRequestSchema>

export const updateTenantAccountResponseSchema = z
  .object({
    tenant: platformTenantSchema,
  })
  .openapi('UpdateTenantAccountResponse')
