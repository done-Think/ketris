import type { ApiContact, ApiContactListItem } from './contact'
import type { Opportunity, OpportunityActivityRecord } from './opportunity'
import type { PublicPropertyDetail, PublicPropertySummary } from './property'

export interface ListOpportunitiesResponse {
  opportunities: Opportunity[]
}

export interface OpportunityResponse {
  opportunity: Opportunity
}

export interface RespondOpportunityResponse {
  opportunity: Opportunity
  activity: OpportunityActivityRecord
}

export interface ListActivitiesResponse {
  activities: OpportunityActivityRecord[]
}

export interface ActivityResponse {
  activity: OpportunityActivityRecord
}

export interface ListPropertiesResponse {
  properties: PublicPropertySummary[]
}

export interface PropertyResponse {
  property: PublicPropertyDetail
}

export interface ListContactsResponse {
  contacts: ApiContactListItem[]
}

export interface ContactResponse {
  contact: ApiContact
}
