export type OpportunityStatus = 'RASCUNHO' | 'ENVIADA' | 'EM_NEGOCIACAO' | 'ACEITA' | 'RECUSADA'

export type GuaranteeType = 'FIADOR' | 'CAUCAO' | 'SEGURO_FIANCA' | 'NENHUMA'

export interface Opportunity {
  id: string
  tenantId: string
  propertyId: string
  contactId: string | null
  leadName: string
  leadEmail: string
  leadPhone: string | null
  proposedValue: number
  contractTermMonths: number | null
  desiredStartDate: Date | null
  guaranteeType: GuaranteeType
  specialConditions: string[]
  notes: string | null
  status: OpportunityStatus
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface NewOpportunity {
  tenantId: string
  propertyId: string
  contactId?: string | null
  leadName: string
  leadEmail: string
  leadPhone: string | null
  proposedValue: number
  notes: string | null
  /** Omitted = ENVIADA (marketplace's public flow). Manual creation can start at RASCUNHO. */
  status?: Extract<OpportunityStatus, 'RASCUNHO' | 'ENVIADA'>
}

export interface OpportunityUpdate {
  contactId?: string | null
  leadName?: string
  leadEmail?: string
  leadPhone?: string | null
  proposedValue?: number
  contractTermMonths?: number | null
  desiredStartDate?: Date | null
  guaranteeType?: GuaranteeType
  specialConditions?: string[]
  notes?: string | null
  status?: OpportunityStatus
}

export interface CreatedOpportunity {
  id: string
  propertyId: string
  status: OpportunityStatus
  createdAt: Date
}

export function toCreatedOpportunity(opportunity: Opportunity): CreatedOpportunity {
  return {
    id: opportunity.id,
    propertyId: opportunity.propertyId,
    status: opportunity.status,
    createdAt: opportunity.createdAt,
  }
}
