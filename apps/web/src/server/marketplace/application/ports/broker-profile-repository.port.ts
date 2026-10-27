import type { DirectoryPage, DirectoryQuery } from '../../types/directory'
import type { BrokerProfile, BrokerProfileDraft } from '../../types/broker-profile'

export interface BrokerProfileRepository {
  findPublishedById(usuarioId: string): Promise<BrokerProfile | null>
  listPublished(query: DirectoryQuery): Promise<DirectoryPage<BrokerProfile>>
  findByUsuarioId(usuarioId: string): Promise<BrokerProfile | null>
  save(usuarioId: string, draft: BrokerProfileDraft): Promise<BrokerProfile>
  setStatus(
    usuarioId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
  ): Promise<BrokerProfile | null>
}
