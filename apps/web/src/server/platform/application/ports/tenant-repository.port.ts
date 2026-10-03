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
  /** Case-insensitive search by name, excluding the given slugs (e.g. the shared renters tenant). */
  searchByName(query: string, excludeSlugs: string[]): Promise<TenantSummary[]>
}
