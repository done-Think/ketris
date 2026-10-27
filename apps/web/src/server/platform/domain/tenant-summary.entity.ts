import type { TenantSummary, TenantSummaryResponse } from '../types/tenant-summary'

export function toTenantSummaryResponse(tenant: TenantSummary): TenantSummaryResponse {
  return {
    id: tenant.id,
    name: tenant.nome,
    slug: tenant.slug,
    createdAt: tenant.createdAt,
  }
}
