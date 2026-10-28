import type { DirectoryPage, DirectoryQuery } from '../../types/directory'
import type { BrokerProfile, BrokerProfileDraft } from '../../types/broker-profile'

export interface BrokerProfileRepository {
  findPublishedById(userId: string): Promise<BrokerProfile | null>
  listPublished(query: DirectoryQuery): Promise<DirectoryPage<BrokerProfile>>
  findByUserId(userId: string): Promise<BrokerProfile | null>
  save(userId: string, draft: BrokerProfileDraft): Promise<BrokerProfile>
  setStatus(
    userId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
  ): Promise<BrokerProfile | null>
}
