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
  source: string
  notes?: string | null
}

export type CreateLeadOutput = Lead
