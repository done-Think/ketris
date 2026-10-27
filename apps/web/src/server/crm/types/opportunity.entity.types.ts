import type { CrmPropertySummary } from './property'

export type OpportunityStatus = 'RASCUNHO' | 'ENVIADA' | 'EM_NEGOCIACAO' | 'ACEITA' | 'RECUSADA'

export type GuaranteeType = 'FIADOR' | 'CAUCAO' | 'SEGURO_FIANCA' | 'NENHUMA'

export interface Opportunity {
  property?: CrmPropertySummary
  id: string
  tenantId: string
  propertyId: string
  responsibleId: string
  responsibleName: string
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
  responsibleId: string
  contactId?: string | null
  leadName: string
  leadEmail: string
  leadPhone: string | null
  proposedValue: number
  notes: string | null
  contractTermMonths?: number | null
  desiredStartDate?: Date | null
  guaranteeType?: GuaranteeType
  specialConditions?: string[]
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
