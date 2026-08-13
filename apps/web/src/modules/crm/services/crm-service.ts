import { BaseService } from '@shared/lib/api/base-service'

import type {
  Opportunity,
  OpportunityFilters,
  SubmittedOpportunity,
  SubmitOpportunityPayload,
  UpdateOpportunityPayload,
} from '../types/opportunity'
import type {
  PublicPropertyDetail,
  PublicPropertySearchFilters,
  PublicPropertySummary,
} from '../types/property'

interface ListOpportunitiesResponse {
  inquiries: Opportunity[]
}

interface OpportunityResponse {
  inquiry: Opportunity
}

interface SubmitOpportunityResponse {
  inquiry: SubmittedOpportunity
}

interface ListPropertiesResponse {
  properties: PublicPropertySummary[]
}

interface PropertyResponse {
  property: PublicPropertyDetail
}

export class CrmService extends BaseService {
  private readonly path = '/marketplace/inquiries'

  list(filters: OpportunityFilters = {}): Promise<Opportunity[]> {
    const params = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.includeArchived !== undefined
        ? { includeArchived: String(filters.includeArchived) }
        : {}),
    }

    return this.http
      .get<ListOpportunitiesResponse>(this.path, { params })
      .then((data) => data.inquiries)
  }

  getById(id: string): Promise<Opportunity> {
    return this.http.get<OpportunityResponse>(`${this.path}/${id}`).then((data) => data.inquiry)
  }

  update(id: string, payload: UpdateOpportunityPayload): Promise<Opportunity> {
    return this.http
      .patch<OpportunityResponse>(`${this.path}/${id}`, payload)
      .then((data) => data.inquiry)
  }

  archive(id: string): Promise<Opportunity> {
    return this.http.delete<OpportunityResponse>(`${this.path}/${id}`).then((data) => data.inquiry)
  }

  submit(propertyId: string, payload: SubmitOpportunityPayload): Promise<SubmittedOpportunity> {
    return this.http
      .post<SubmitOpportunityResponse>(`/marketplace/properties/${propertyId}/inquiries`, payload)
      .then((data) => data.inquiry)
  }

  listProperties(filters: PublicPropertySearchFilters = {}): Promise<PublicPropertySummary[]> {
    return this.http
      .get<ListPropertiesResponse>('/marketplace/properties', { params: filters })
      .then((data) => data.properties)
  }

  getProperty(id: string): Promise<PublicPropertyDetail> {
    return this.http
      .get<PropertyResponse>(`/marketplace/properties/${id}`)
      .then((data) => data.property)
  }
}

export const crmService = new CrmService()
