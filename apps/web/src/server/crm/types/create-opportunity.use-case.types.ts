import type { Papel } from '@server/auth/domain/user.entity'
import type { GuaranteeType, Opportunity } from '../domain/opportunity.entity'

export interface CreateOpportunityInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  actorName?: string | null
  propertyId: string
  responsibleId?: string | null
  contactId?: string | null
  leadName: string
  leadEmail: string
  leadPhone?: string | null
  proposedValue: number
  contractTermMonths?: number | null
  desiredStartDate?: Date | null
  guaranteeType?: GuaranteeType
  specialConditions?: string[]
  notes?: string | null
  status?: 'RASCUNHO' | 'ENVIADA'
}

export type CreateOpportunityOutput = Opportunity
