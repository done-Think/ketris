import '@server/openapi/zod-extend'
import { z } from 'zod'

import { platformTenantSchema, tenantAccountTypeSchema, tenantStatusSchema } from './tenant.schema'

export const updateTenantAccountRequestSchema = z
  .object({
    accountType: tenantAccountTypeSchema,
    status: tenantStatusSchema,
  })
  .strict()
  .openapi('UpdateTenantAccountRequest')

export const updateTenantAccountResponseSchema = z
  .object({
    tenant: platformTenantSchema,
  })
  .openapi('UpdateTenantAccountResponse')
