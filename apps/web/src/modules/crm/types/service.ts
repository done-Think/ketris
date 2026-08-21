import type { Opportunity } from './opportunity'
import type { PublicPropertyDetail, PublicPropertySummary } from './property'

export interface ListOpportunitiesResponse {
  inquiries: Opportunity[]
}

export interface OpportunityResponse {
  inquiry: Opportunity
}

export interface ListPropertiesResponse {
  properties: PublicPropertySummary[]
}

export interface PropertyResponse {
  property: PublicPropertyDetail
}
