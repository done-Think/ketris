import type { BrokerProfile, BrokerProfileDraft } from '../../types/broker-profile'
import type {
  ProfileDirectoryFilters,
  ProfileDirectoryPage,
  ProfileDirectoryResult,
} from '../../types/profile-directory'

export interface BrokerProfileRepository {
  findPublishedById(usuarioId: string): Promise<BrokerProfile | null>
  listPublished(
    filters: ProfileDirectoryFilters,
    page: ProfileDirectoryPage,
  ): Promise<ProfileDirectoryResult<BrokerProfile>>
  findByUsuarioId(usuarioId: string): Promise<BrokerProfile | null>
  save(usuarioId: string, draft: BrokerProfileDraft): Promise<BrokerProfile>
  setStatus(
    usuarioId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
  ): Promise<BrokerProfile | null>
}
