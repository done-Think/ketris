import type { TenantSummary } from '../../domain/tenant-summary.entity'

export interface NewTenant {
  nome: string
  slug: string
}

export interface TenantRepository {
  findBySlug(slug: string): Promise<TenantSummary | null>
  findById(id: string): Promise<TenantSummary | null>
  findMany(): Promise<TenantSummary[]>
  create(tenant: NewTenant): Promise<TenantSummary>
}
