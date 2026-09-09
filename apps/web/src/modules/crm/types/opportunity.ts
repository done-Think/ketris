import type { z } from 'zod'

import type {
  contractGuaranteeSchema,
  editOpportunityFormSchema,
  opportunityFiltersSchema,
  opportunityStatusSchema,
  updateOpportunitySchema,
} from '../schemas/opportunity-schema'

export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>
export type ContractGuarantee = z.infer<typeof contractGuaranteeSchema>
export type OpportunityFilters = z.infer<typeof opportunityFiltersSchema>
export type UpdateOpportunityPayload = z.infer<typeof updateOpportunitySchema>
export type OpportunityEditFormValues = z.infer<typeof editOpportunityFormSchema>

export interface Opportunity {
  id: string
  tenantId: string
  propertyId: string
  contactId?: string | null
  leadName: string
  leadEmail: string
  leadPhone: string | null
  proposedValue: number
  contractTermMonths: number | null
  desiredStartDate: string | null
  guaranteeType: ContractGuarantee
  specialConditions: string[]
  notes: string | null
  status: OpportunityStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateOpportunityInput {
  id: string
  changes: UpdateOpportunityPayload
}

/**
 * Manual opportunity creation — see POST /crm/opportunities. No Zod schema of its own yet: no
 * form in the frontend consumes this (the pipeline's "New Opportunity" button stays disabled);
 * the type exists for the service layer, ready for when that form gets built.
 */
export interface CreateOpportunityPayload {
  propertyId: string
  contactId?: string | null
  leadName: string
  leadEmail: string
  leadPhone?: string | null
  proposedValue: number
  notes?: string | null
  status?: Extract<OpportunityStatus, 'RASCUNHO' | 'ENVIADA'>
}

/** The broker's decision on a received proposal — see POST /crm/opportunities/{id}/respond. */
export type OpportunityResponseAction = 'ACEITAR' | 'RECUSAR' | 'SOLICITAR_INFORMACOES'

export interface RespondOpportunityPayload {
  action: OpportunityResponseAction
  message?: string | null
}

export interface OpportunityActivityRecord {
  id: string
  opportunityId: string
  type: 'NOTA' | 'MUDANCA_STATUS' | 'CONTATO_REALIZADO' | 'PROPOSTA_RESPONDIDA'
  description: string
  authorId: string | null
  authorName: string | null
  previousStatus: OpportunityStatus | null
  newStatus: OpportunityStatus | null
  createdAt: string
}
