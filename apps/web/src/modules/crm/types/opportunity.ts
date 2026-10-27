import type {
  ListOpportunityResponsiblesResponseDTO,
  CreateOpportunityRequestDTO,
  OpportunityActivityDTO,
  OpportunityDTO,
  PatchOpportunityRequestDTO,
  RespondOpportunityRequestDTO,
} from '@server/crm/types/dto'
import type { z } from 'zod'

import type {
  contractGuaranteeSchema,
  createEditOpportunityFormSchema,
  createOpportunityFormSchema,
  opportunityStatusSchema,
} from '../schemas/opportunity-schema'

export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>
export type ContractGuarantee = z.infer<typeof contractGuaranteeSchema>
export type OpportunityFilters = import('@server/crm/types/dto').ListOpportunitiesQueryDTO
export type UpdateOpportunityPayload = PatchOpportunityRequestDTO
export type OpportunityEditFormValues = z.infer<ReturnType<typeof createEditOpportunityFormSchema>>
export type CreateOpportunityFormValues = z.infer<ReturnType<typeof createOpportunityFormSchema>>

export type Opportunity = OpportunityDTO

export interface UpdateOpportunityInput {
  id: string
  changes: UpdateOpportunityPayload
}

export type CreateOpportunityPayload = CreateOpportunityRequestDTO

export type OpportunityResponseAction = 'ACEITAR' | 'RECUSAR' | 'SOLICITAR_INFORMACOES'

export type RespondOpportunityPayload = RespondOpportunityRequestDTO

export type OpportunityActivityRecord = OpportunityActivityDTO

export type OpportunityResponsibleOption =
  ListOpportunityResponsiblesResponseDTO['responsibles'][number]
