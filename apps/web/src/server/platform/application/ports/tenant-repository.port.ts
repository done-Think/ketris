import type { TenantAccountType } from '../../domain/tenant-account'
import type { TenantSummary } from '../../domain/tenant-summary.entity'

export interface NewTenant {
  nome: string
  slug: string
  // Defaults to an active agency when omitted.
  accountType?: TenantAccountType
  status?: 'TRIAL' | 'ACTIVE'
}

export interface TenantRepository {
  findBySlug(slug: string): Promise<TenantSummary | null>
  findById(id: string): Promise<TenantSummary | null>
  findMany(): Promise<TenantSummary[]>
  create(tenant: NewTenant): Promise<TenantSummary>
  searchByName(query: string, excludeSlugs: string[]): Promise<TenantSummary[]>
}
