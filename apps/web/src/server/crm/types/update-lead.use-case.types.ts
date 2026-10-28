import type { UserRole } from '@server/auth/domain/user.entity'
import type { Lead, LeadUpdate } from '../domain/lead.entity'

export interface UpdateLeadInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  leadId: string
  changes: LeadUpdate
}

export type UpdateLeadOutput = Lead
