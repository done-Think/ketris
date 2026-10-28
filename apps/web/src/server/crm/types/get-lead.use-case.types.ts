import type { UserRole } from '@server/auth/domain/user.entity'
import type { Lead } from '../domain/lead.entity'

export interface GetLeadInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  leadId: string
}

export type GetLeadOutput = Lead
