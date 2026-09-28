import type { BrokerProfile, BrokerProfileDraft } from '../../domain/broker-profile.entity'

export interface BrokerProfileRepository {
  findPublishedById(usuarioId: string): Promise<BrokerProfile | null>
  listPublished(): Promise<BrokerProfile[]>
  findByUsuarioId(usuarioId: string): Promise<BrokerProfile | null>
  save(usuarioId: string, draft: BrokerProfileDraft): Promise<BrokerProfile>
  setStatus(
    usuarioId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
  ): Promise<BrokerProfile | null>
}
