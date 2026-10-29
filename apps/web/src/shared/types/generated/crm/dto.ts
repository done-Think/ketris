import type { components } from '../api'

export type OpportunityDTO = components['schemas']['Opportunity']
export type OpportunityStatusDTO = components['schemas']['OpportunityStatus']
export type GuaranteeTypeDTO = components['schemas']['GuaranteeType']
export type CreateOpportunityRequestDTO = components['schemas']['CreateOpportunityRequest']
export type PatchOpportunityRequestDTO = components['schemas']['PatchOpportunityRequest']
export type ListOpportunitiesQueryDTO = Partial<components['schemas']['ListOpportunitiesQuery']>
export type ListOpportunitiesResponseDTO = components['schemas']['ListOpportunitiesResponse']
export type ListOpportunityResponsiblesResponseDTO =
  components['schemas']['ListOpportunityResponsiblesResponse']
export type OpportunityResponseDTO = components['schemas']['OpportunityResponse']
export type ContactDTO = components['schemas']['Contact']
export type ContactListItemDTO = components['schemas']['ContactListItem']
export type ContactTypeDTO = components['schemas']['ContactType']
export type CreateContactRequestDTO = components['schemas']['CreateContactRequest']
export type PatchContactRequestDTO = components['schemas']['PatchContactRequest']
export type ListContactsQueryDTO = Partial<components['schemas']['ListContactsQuery']>
export type ListContactsResponseDTO = components['schemas']['ListContactsResponse']
export type ContactResponseDTO = components['schemas']['ContactResponse']
export type LeadDTO = components['schemas']['Lead']
export type LeadStageDTO = components['schemas']['LeadStage']
export type CreateLeadRequestDTO = components['schemas']['CreateLeadRequest']
export type PatchLeadRequestDTO = components['schemas']['PatchLeadRequest']
export type ConvertLeadRequestDTO = components['schemas']['ConvertLeadRequest']
export type ListLeadsResponseDTO = components['schemas']['ListLeadsResponse']
export type LeadResponseDTO = components['schemas']['LeadResponse']
export type ConvertLeadResponseDTO = components['schemas']['ConvertLeadResponse']
export type OpportunityActivityDTO = components['schemas']['OpportunityActivity']
export type ListActivitiesResponseDTO = components['schemas']['ListOpportunityActivitiesResponse']
export type ActivityResponseDTO = components['schemas']['OpportunityActivityResponse']
export type RespondOpportunityRequestDTO = components['schemas']['RespondOpportunityRequest']
export type RespondOpportunityResponseDTO = components['schemas']['RespondOpportunityResponse']
export type LeadListQueryDTO = Partial<components['schemas']['LeadListQuery']>
