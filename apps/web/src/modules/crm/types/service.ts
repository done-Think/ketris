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
} from '@shared/types/generated/crm/dto'

export type ListOpportunitiesResponse = ListOpportunitiesResponseDTO

export type OpportunityResponse = OpportunityResponseDTO

export type RespondOpportunityResponse = RespondOpportunityResponseDTO

export type ListActivitiesResponse = ListActivitiesResponseDTO

export type ActivityResponse = ActivityResponseDTO

export type ListPropertiesResponse = import('@shared/types/generated/crm/property').CrmPropertyPage

export type PropertyResponse = import('@shared/types/generated/crm/property').CrmPropertyResponse

export type ListContactsResponse = ListContactsResponseDTO

export type ContactResponse = ContactResponseDTO

export type ListLeadsResponse = ListLeadsResponseDTO

export type LeadResponse = LeadResponseDTO

export type ConvertLeadResponse = ConvertLeadResponseDTO
