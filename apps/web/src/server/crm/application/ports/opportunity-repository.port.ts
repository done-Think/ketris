import type {
  NewOpportunity,
  Opportunity,
  OpportunityUpdate,
} from '../../domain/opportunity.entity'
import type { CrmListFilters, CrmPage } from '../../types/pagination'

export interface OpportunityListFilters extends CrmListFilters {
  summaryScope?: 'all' | 'results'
  statuses?: Opportunity['status'][]
  status?: Opportunity['status']
  includeArchived?: boolean
  contactId?: string
  responsibleId?: string
}

export interface OpportunityRepository {
  create(opportunity: NewOpportunity): Promise<Opportunity>
  findManyByTenant(
    tenantId: string,
    filters?: OpportunityListFilters,
  ): Promise<CrmPage<Opportunity>>
  findById(id: string): Promise<Opportunity | null>
  update(id: string, changes: OpportunityUpdate): Promise<Opportunity>
  syncContactDetails(
    tenantId: string,
    contactId: string,
    details: { name: string; email: string; phone: string | null },
  ): Promise<void>
  archive(id: string): Promise<Opportunity>
  assignResponsible(id: string, responsibleId: string): Promise<Opportunity>
  delete(id: string): Promise<void>
  countByContact(tenantId: string, contactIds: readonly string[]): Promise<Map<string, number>>
  existsForAgent(tenantId: string, contactId: string, agentId: string): Promise<boolean>
}
