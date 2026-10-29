import type { z } from 'zod'
import type {
  activityResponseSchema,
  listActivitiesResponseSchema,
  opportunityActivitySchema,
} from '../schemas/activity.schema'
import type {
  contactListItemSchema,
  contactResponseSchema,
  contactSchema,
  contactTypeSchema,
  createContactRequestSchema,
  listContactsQuerySchema,
  listContactsResponseSchema,
  patchContactRequestSchema,
} from '../schemas/contact.schema'
import type {
  convertLeadRequestSchema,
  convertLeadResponseSchema,
  createLeadRequestSchema,
  leadResponseSchema,
  leadSchema,
  leadStageSchema,
  listLeadsResponseSchema,
  patchLeadRequestSchema,
} from '../schemas/lead.schema'
import type {
  createOpportunityRequestSchema,
  guaranteeTypeSchema,
  listOpportunitiesQuerySchema,
  listOpportunitiesResponseSchema,
  listOpportunityResponsiblesResponseSchema,
  opportunityResponseSchema,
  opportunitySchema,
  opportunityStatusSchema,
  patchOpportunityRequestSchema,
} from '../schemas/opportunity.schema'
import type {
  respondOpportunityRequestSchema,
  respondOpportunityResponseSchema,
} from '../schemas/respond-opportunity.schema'

export type CrmJson<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? CrmJson<U>[]
    : T extends object
      ? { [K in keyof T]: CrmJson<T[K]> }
      : T
export type OpportunityDTO = CrmJson<z.infer<typeof opportunitySchema>>
export type OpportunityStatusDTO = CrmJson<z.infer<typeof opportunityStatusSchema>>
export type GuaranteeTypeDTO = CrmJson<z.infer<typeof guaranteeTypeSchema>>
export type CreateOpportunityRequestDTO = CrmJson<z.infer<typeof createOpportunityRequestSchema>>
export type PatchOpportunityRequestDTO = CrmJson<z.infer<typeof patchOpportunityRequestSchema>>
export type ListOpportunitiesQueryDTO = Partial<
  CrmJson<z.infer<typeof listOpportunitiesQuerySchema>>
>
export type ListOpportunitiesResponseDTO = CrmJson<z.infer<typeof listOpportunitiesResponseSchema>>
export type ListOpportunityResponsiblesResponseDTO = CrmJson<
  z.infer<typeof listOpportunityResponsiblesResponseSchema>
>
export type OpportunityResponseDTO = CrmJson<z.infer<typeof opportunityResponseSchema>>
export type ContactDTO = CrmJson<z.infer<typeof contactSchema>>
export type ContactListItemDTO = CrmJson<z.infer<typeof contactListItemSchema>>
export type ContactTypeDTO = CrmJson<z.infer<typeof contactTypeSchema>>
export type CreateContactRequestDTO = CrmJson<z.infer<typeof createContactRequestSchema>>
export type PatchContactRequestDTO = CrmJson<z.infer<typeof patchContactRequestSchema>>
export type ListContactsQueryDTO = Partial<CrmJson<z.infer<typeof listContactsQuerySchema>>>
export type ListContactsResponseDTO = CrmJson<z.infer<typeof listContactsResponseSchema>>
export type ContactResponseDTO = CrmJson<z.infer<typeof contactResponseSchema>>
export type LeadDTO = CrmJson<z.infer<typeof leadSchema>>
export type LeadStageDTO = CrmJson<z.infer<typeof leadStageSchema>>
export type CreateLeadRequestDTO = CrmJson<z.infer<typeof createLeadRequestSchema>>
export type PatchLeadRequestDTO = CrmJson<z.infer<typeof patchLeadRequestSchema>>
export type ConvertLeadRequestDTO = CrmJson<z.infer<typeof convertLeadRequestSchema>>
export type ListLeadsResponseDTO = CrmJson<z.infer<typeof listLeadsResponseSchema>>
export type LeadResponseDTO = CrmJson<z.infer<typeof leadResponseSchema>>
export type ConvertLeadResponseDTO = CrmJson<z.infer<typeof convertLeadResponseSchema>>
export type OpportunityActivityDTO = CrmJson<z.infer<typeof opportunityActivitySchema>>
export type ListActivitiesResponseDTO = CrmJson<z.infer<typeof listActivitiesResponseSchema>>
export type ActivityResponseDTO = CrmJson<z.infer<typeof activityResponseSchema>>
export type RespondOpportunityRequestDTO = CrmJson<z.infer<typeof respondOpportunityRequestSchema>>
export type RespondOpportunityResponseDTO = CrmJson<
  z.infer<typeof respondOpportunityResponseSchema>
>

export type LeadListQueryDTO = Partial<
  z.infer<typeof import('../schemas/lead.schema').listLeadsQuerySchema>
>
