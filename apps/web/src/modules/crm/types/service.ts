import type {
  ActivityResponseDTO,
  ContactResponseDTO,
  ConvertLeadResponseDTO,
  LeadResponseDTO,
  ListActivitiesResponseDTO,
  ListContactsResponseDTO,
  ListLeadsResponseDTO,
  ListOpportunitiesResponseDTO,
  OpportunityResponseDTO,
  RespondOpportunityResponseDTO,
} from '@server/crm/types/dto'

export type ListOpportunitiesResponse = ListOpportunitiesResponseDTO

export type OpportunityResponse = OpportunityResponseDTO

export type RespondOpportunityResponse = RespondOpportunityResponseDTO

export type ListActivitiesResponse = ListActivitiesResponseDTO

export type ActivityResponse = ActivityResponseDTO

export type ListPropertiesResponse = import('@server/crm/types/property').CrmPropertyPage

export type PropertyResponse = import('@server/crm/types/property').CrmPropertyResponse

export type ListContactsResponse = ListContactsResponseDTO

export type ContactResponse = ContactResponseDTO

export type ListLeadsResponse = ListLeadsResponseDTO

export type LeadResponse = LeadResponseDTO

export type ConvertLeadResponse = ConvertLeadResponseDTO
