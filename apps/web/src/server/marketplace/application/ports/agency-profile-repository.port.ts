import type { AgencyProfile, AgencyProfileDraft } from '../../types/agency-profile'
import type {
  ProfileDirectoryFilters,
  ProfileDirectoryPage,
  ProfileDirectoryResult,
} from '../../types/profile-directory'

export interface AgencyProfileRepository {
  findPublishedById(tenantId: string): Promise<AgencyProfile | null>
  findPublishedBySlug(slug: string, creci: string): Promise<AgencyProfile | null>
  listPublished(
    filters: ProfileDirectoryFilters,
    page: ProfileDirectoryPage,
  ): Promise<ProfileDirectoryResult<AgencyProfile>>
  findByTenantId(tenantId: string): Promise<AgencyProfile | null>
  save(tenantId: string, draft: AgencyProfileDraft): Promise<AgencyProfile>
  setStatus(
    tenantId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
  ): Promise<AgencyProfile | null>
}
