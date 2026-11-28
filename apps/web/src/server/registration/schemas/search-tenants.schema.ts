import '@server/openapi/zod-extend'
import { z } from 'zod'

export const searchTenantsQuerySchema = z.object({
  // Queries with fewer than two non-space characters return an empty list (public endpoint).
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
