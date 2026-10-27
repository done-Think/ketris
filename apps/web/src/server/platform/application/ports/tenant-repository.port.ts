import type { TenantSummary } from '../../types/tenant-summary'
import type { NewTenant } from '../../types/tenant-repository'

export interface TenantRepository {
  findBySlug(slug: string): Promise<TenantSummary | null>
  findById(id: string): Promise<TenantSummary | null>
  create(tenant: NewTenant): Promise<TenantSummary>
  searchByName(query: string, excludeSlugs: string[]): Promise<TenantSummary[]>
}
