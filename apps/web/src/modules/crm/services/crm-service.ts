import type { ListOpportunityResponsiblesResponseDTO } from '@shared/types/generated/crm/dto'
import { BaseService } from '@shared/lib/api/base-service'

import type {
  ApiContact,
  ContactFilters,
  CreateContactPayload,
  UpdateContactPayload,
} from '../types/contact'
import type {
  ConvertLeadPayload,
  CreateLeadPayload,
  Lead,
  LeadListFilters,
  UpdateLeadStagePayload,
} from '../types/lead'
import type {
  CreateOpportunityPayload,
  Opportunity,
  OpportunityFilters,
  OpportunityResponsibleOption,
  RespondOpportunityPayload,
  UpdateOpportunityPayload,
} from '../types/opportunity'
import type { CrmPropertyDetail, CrmPropertySearchFilters } from '../types/property'
import type {
  ActivityResponse,
  ContactResponse,
  ConvertLeadResponse,
  LeadResponse,
  ListActivitiesResponse,
  ListContactsResponse,
  ListLeadsResponse,
  ListOpportunitiesResponse,
  ListPropertiesResponse,
  OpportunityResponse,
  PropertyResponse,
  RespondOpportunityResponse,
} from '../types/service'

export class CrmService extends BaseService {
  private readonly path = '/crm/opportunities'
  private readonly contactsPath = '/crm/contacts'
  private readonly leadsPath = '/crm/leads'

  list(filters: OpportunityFilters = {}): Promise<ListOpportunitiesResponse> {
    const params = {
      ...filters,
      statuses: filters.statuses?.join(','),
      includeArchived:
        filters.includeArchived === undefined ? undefined : String(filters.includeArchived),
    }
    return this.http.get<ListOpportunitiesResponse>(this.path, { params })
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

  listResponsibles(): Promise<OpportunityResponsibleOption[]> {
    return this.http
      .get<ListOpportunityResponsiblesResponseDTO>('/crm/responsibles')
      .then((data) => data.responsibles)
  }

  assignResponsible(id: string, responsibleId: string): Promise<Opportunity> {
    return this.http
      .put<OpportunityResponse>(`${this.path}/${id}/responsible`, { responsibleId })
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

  addNote(opportunityId: string, description: string, type: 'NOTE' | 'CONTACT_MADE' = 'NOTE') {
    return this.http
      .post<ActivityResponse>(`${this.path}/${opportunityId}/activities`, { description, type })
      .then((data) => data.activity)
  }

  listProperties(filters: CrmPropertySearchFilters = {}): Promise<ListPropertiesResponse> {
    return this.http.get<ListPropertiesResponse>('/crm/properties', { params: filters })
  }

  getProperty(id: string): Promise<CrmPropertyDetail> {
    return this.http.get<PropertyResponse>(`/crm/properties/${id}`).then((data) => data.property)
  }

  getPublishedProperty(id: string): Promise<CrmPropertyDetail> {
    return this.http
      .get<PropertyResponse>(`/marketplace/properties/${id}`)
      .then((data) => data.property)
  }

  listContacts(filters: ContactFilters = {}): Promise<ListContactsResponse> {
    const params = {
      ...filters,
      includeArchived:
        filters.includeArchived === undefined ? undefined : String(filters.includeArchived),
    }
    return this.http.get<ListContactsResponse>(this.contactsPath, { params })
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

  listLeads(filters: LeadListFilters = {}): Promise<ListLeadsResponse> {
    return this.http.get<ListLeadsResponse>(this.leadsPath, { params: filters })
  }

  getLead(id: string): Promise<Lead> {
    return this.http.get<LeadResponse>(`${this.leadsPath}/${id}`).then((data) => data.lead)
  }

  createLead(payload: CreateLeadPayload): Promise<Lead> {
    return this.http.post<LeadResponse>(this.leadsPath, payload).then((data) => data.lead)
  }

  updateLeadStage(id: string, payload: UpdateLeadStagePayload): Promise<Lead> {
    return this.http
      .patch<LeadResponse>(`${this.leadsPath}/${id}`, payload)
      .then((data) => data.lead)
  }

  convertLead(id: string, payload: ConvertLeadPayload): Promise<ConvertLeadResponse> {
    return this.http.post<ConvertLeadResponse>(`${this.leadsPath}/${id}/convert`, payload)
  }
}

export const crmService = new CrmService()
