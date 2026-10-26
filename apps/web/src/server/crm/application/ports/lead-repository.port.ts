import type { Lead, LeadUpdate, NewLead } from '../../domain/lead.entity'
import type { CrmListFilters, CrmPage } from '../../types/pagination'

export interface LeadListFilters extends CrmListFilters {
  stage?: Lead['stage']
  responsavelId?: string
}

export interface LeadRepository {
  create(lead: NewLead): Promise<Lead>
  findManyByTenant(tenantId: string, filters?: LeadListFilters): Promise<CrmPage<Lead>>
  findById(id: string): Promise<Lead | null>
  update(id: string, changes: LeadUpdate): Promise<Lead>
  markConverted(id: string, opportunityId: string, email?: string): Promise<Lead>
}
