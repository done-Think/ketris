import type { Lead, LeadUpdate, NewLead } from '../../domain/lead.entity'

export interface LeadListFilters {
  /** Set only when the actor is an AGENT — scopes results to leads they're responsible for. */
  responsavelId?: string
}

export interface LeadRepository {
  create(lead: NewLead): Promise<Lead>
  findManyByTenant(tenantId: string, filters?: LeadListFilters): Promise<Lead[]>
  findById(id: string): Promise<Lead | null>
  update(id: string, changes: LeadUpdate): Promise<Lead>
  markConverted(id: string, opportunityId: string): Promise<Lead>
}
