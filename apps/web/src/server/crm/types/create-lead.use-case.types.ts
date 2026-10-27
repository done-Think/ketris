import type { LeadSource } from '../constants/lead-sources'
import type { Papel } from '@server/auth/domain/user.entity'
import type { Lead } from '../domain/lead.entity'

export interface CreateLeadInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  name: string
  phone: string
  email?: string | null
  interest: string
  budget: string
  source: LeadSource
  notes?: string | null
}

export type CreateLeadOutput = Lead
