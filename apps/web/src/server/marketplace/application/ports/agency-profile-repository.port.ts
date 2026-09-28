import type { AgencyProfile, AgencyProfileDraft } from '../../domain/agency-profile.entity'

export interface AgencyProfileRepository {
  findPublishedById(tenantId: string): Promise<AgencyProfile | null>
  listPublished(): Promise<AgencyProfile[]>
  findByTenantId(tenantId: string): Promise<AgencyProfile | null>
  save(tenantId: string, draft: AgencyProfileDraft): Promise<AgencyProfile>
  setStatus(
    tenantId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
  ): Promise<AgencyProfile | null>
}
