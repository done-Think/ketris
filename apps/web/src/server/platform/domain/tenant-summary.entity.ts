export interface TenantSummary {
  id: string
  nome: string
  slug: string
  createdAt: Date
}

export interface TenantSummaryResponse {
  id: string
  name: string
  slug: string
  createdAt: Date
}

export function toTenantSummaryResponse(tenant: TenantSummary): TenantSummaryResponse {
  return {
    id: tenant.id,
    name: tenant.nome,
    slug: tenant.slug,
    createdAt: tenant.createdAt,
  }
}
