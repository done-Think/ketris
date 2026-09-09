import type {
  NewOpportunity,
  Opportunity,
  OpportunityUpdate,
} from '../../domain/opportunity.entity'

export interface OpportunityListFilters {
  status?: Opportunity['status']
  includeArchived?: boolean
  contactId?: string
}

export interface OpportunityRepository {
  create(opportunity: NewOpportunity): Promise<Opportunity>
  findManyByTenant(tenantId: string, filters?: OpportunityListFilters): Promise<Opportunity[]>
  findById(id: string): Promise<Opportunity | null>
  update(id: string, changes: OpportunityUpdate): Promise<Opportunity>
  archive(id: string): Promise<Opportunity>
  delete(id: string): Promise<void>
  countByContact(tenantId: string, contactIds: readonly string[]): Promise<Map<string, number>>
}
