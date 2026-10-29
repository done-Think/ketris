import type {
  ListOpportunityResponsiblesResponseDTO,
  CreateOpportunityRequestDTO,
  OpportunityActivityDTO,
  OpportunityDTO,
  PatchOpportunityRequestDTO,
  RespondOpportunityRequestDTO,
} from '@shared/types/generated/crm/dto'
import type { z } from 'zod'

import type {
  contractGuaranteeSchema,
  createEditOpportunityFormSchema,
  createOpportunityFormSchema,
  opportunityStatusSchema,
} from '../schemas/opportunity-schema'

export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>
export type ContractGuarantee = z.infer<typeof contractGuaranteeSchema>
export type OpportunityFilters = Omit<
  import('@shared/types/generated/crm/dto').ListOpportunitiesQueryDTO,
  'includeArchived' | 'statuses'
> & { includeArchived?: boolean; statuses?: OpportunityStatus[] }
export type UpdateOpportunityPayload = PatchOpportunityRequestDTO
export type OpportunityEditFormValues = z.infer<ReturnType<typeof createEditOpportunityFormSchema>>
export type CreateOpportunityFormValues = z.infer<ReturnType<typeof createOpportunityFormSchema>>

export type Opportunity = OpportunityDTO

export interface UpdateOpportunityInput {
  id: string
  changes: UpdateOpportunityPayload
}

export type CreateOpportunityPayload = CreateOpportunityRequestDTO

export type OpportunityResponseAction = RespondOpportunityRequestDTO['action']

export type RespondOpportunityPayload = RespondOpportunityRequestDTO

export type OpportunityActivityRecord = OpportunityActivityDTO

export type OpportunityResponsibleOption =
  ListOpportunityResponsiblesResponseDTO['responsibles'][number]
