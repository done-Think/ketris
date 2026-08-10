import '@server/openapi/zod-extend'
import { z } from 'zod'

import { tenantSummarySchema } from './tenant.schema'

export const listTenantsResponseSchema = z
  .object({
    tenants: z.array(tenantSummarySchema),
  })
  .openapi('ListTenantsResponse')
