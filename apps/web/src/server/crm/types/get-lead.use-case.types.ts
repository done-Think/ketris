import type { Papel } from '@server/auth/domain/user.entity'
import type { Lead } from '../domain/lead.entity'

export interface GetLeadInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  leadId: string
}

export type GetLeadOutput = Lead
