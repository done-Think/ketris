import type { LeadSource } from './lead-source'
import type { UserRole } from '@server/auth/domain/user.entity'
import type { Lead } from '../domain/lead.entity'

export interface CreateLeadInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  name: string
  phone: string
  email?: string | null
  interest: string
  propertyId?: string
  budget: string
  source: LeadSource
  notes?: string | null
}

export type CreateLeadOutput = Lead
