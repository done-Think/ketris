import '@server/openapi/zod-extend'
import { z } from 'zod'

import { platformTenantSchema } from './tenant.schema'

export const listTenantsResponseSchema = z
  .object({
    tenants: z.array(platformTenantSchema),
  })
  .openapi('ListTenantsResponse')
