import type { DirectoryPage, DirectoryQuery } from '../../types/directory'
import type { AgencyProfile, AgencyProfileDraft } from '../../types/agency-profile'

export interface AgencyProfileRepository {
  findPublishedById(tenantId: string): Promise<AgencyProfile | null>
  findPublishedBySlug(slug: string, creci: string): Promise<AgencyProfile | null>
  listPublished(query: DirectoryQuery): Promise<DirectoryPage<AgencyProfile>>
  findByTenantId(tenantId: string): Promise<AgencyProfile | null>
  save(tenantId: string, draft: AgencyProfileDraft, actorId?: string): Promise<AgencyProfile>
  setStatus(
    tenantId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
    actorId?: string,
  ): Promise<AgencyProfile | null>
}
