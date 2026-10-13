import '@server/openapi/zod-extend'
import { z } from 'zod'

export const searchTenantsQuerySchema = z.object({
  q: z.string().trim().min(1, 'Informe um termo de busca.'),
})

export type SearchTenantsQueryDTO = z.infer<typeof searchTenantsQuerySchema>

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
