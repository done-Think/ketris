import '@server/openapi/zod-extend'
import { z } from 'zod'

export const searchTenantsQuerySchema = z.object({
  // An empty query lists the first agencies so the broker sees options as soon as the field opens.
  q: z.string().trim().max(100).default(''),
})

const tenantSearchResultSchema = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .openapi('TenantSearchResult')

export const searchTenantsResponseSchema = z
  .object({
    tenants: z.array(tenantSearchResultSchema),
  })
  .openapi('SearchTenantsResponse')
