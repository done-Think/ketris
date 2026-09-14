import { BaseService } from '@shared/lib/api/base-service'

import type {
  ApiContact,
  ApiContactListItem,
  ContactFilters,
  CreateContactPayload,
  UpdateContactPayload,
} from '../types/contact'
import type {
  CreateOpportunityPayload,
  Opportunity,
  OpportunityFilters,
  RespondOpportunityPayload,
  UpdateOpportunityPayload,
} from '../types/opportunity'
import type {
  PublicPropertyDetail,
  PublicPropertySearchFilters,
  PublicPropertySummary,
} from '../types/property'
import type {
  ActivityResponse,
  ContactResponse,
  ListActivitiesResponse,
  ListContactsResponse,
  ListOpportunitiesResponse,
  ListPropertiesResponse,
  OpportunityResponse,
  PropertyResponse,
  RespondOpportunityResponse,
} from '../types/service'

export class CrmService extends BaseService {
  private readonly path = '/crm/opportunities'
  private readonly contactsPath = '/crm/contacts'

  list(filters: OpportunityFilters = {}): Promise<Opportunity[]> {
    const params = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.includeArchived !== undefined
        ? { includeArchived: String(filters.includeArchived) }
        : {}),
    }

    return this.http
      .get<ListOpportunitiesResponse>(this.path, { params })
      .then((data) => data.opportunities)
  }

  getById(id: string): Promise<Opportunity> {
    return this.http.get<OpportunityResponse>(`${this.path}/${id}`).then((data) => data.opportunity)
  }

  create(payload: CreateOpportunityPayload): Promise<Opportunity> {
    return this.http.post<OpportunityResponse>(this.path, payload).then((data) => data.opportunity)
  }

  update(id: string, payload: UpdateOpportunityPayload): Promise<Opportunity> {
    return this.http
      .patch<OpportunityResponse>(`${this.path}/${id}`, payload)
      .then((data) => data.opportunity)
  }

  archive(id: string): Promise<Opportunity> {
    return this.http
      .delete<OpportunityResponse>(`${this.path}/${id}`)
      .then((data) => data.opportunity)
  }

  respond(id: string, payload: RespondOpportunityPayload): Promise<RespondOpportunityResponse> {
    return this.http.post<RespondOpportunityResponse>(`${this.path}/${id}/respond`, payload)
  }

  listActivities(opportunityId: string) {
    return this.http
      .get<ListActivitiesResponse>(`${this.path}/${opportunityId}/activities`)
      .then((data) => data.activities)
  }

  addNote(opportunityId: string, description: string) {
    return this.http
      .post<ActivityResponse>(`${this.path}/${opportunityId}/activities`, { description })
      .then((data) => data.activity)
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

  listContacts(filters: ContactFilters = {}): Promise<ApiContactListItem[]> {
    const params = {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.includeArchived !== undefined
        ? { includeArchived: String(filters.includeArchived) }
        : {}),
    }

    return this.http
      .get<ListContactsResponse>(this.contactsPath, { params })
      .then((data) => data.contacts)
  }

  getContact(id: string): Promise<ApiContact> {
    return this.http.get<ContactResponse>(`${this.contactsPath}/${id}`).then((data) => data.contact)
  }

  createContact(payload: CreateContactPayload): Promise<ApiContact> {
    return this.http.post<ContactResponse>(this.contactsPath, payload).then((data) => data.contact)
  }

  updateContact(id: string, changes: UpdateContactPayload): Promise<ApiContact> {
    return this.http
      .patch<ContactResponse>(`${this.contactsPath}/${id}`, changes)
      .then((data) => data.contact)
  }

  archiveContact(id: string): Promise<ApiContact> {
    return this.http
      .delete<ContactResponse>(`${this.contactsPath}/${id}`)
      .then((data) => data.contact)
  }
}

export const crmService = new CrmService()
