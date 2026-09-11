import type {
  NewOpportunity,
  Opportunity,
  OpportunityUpdate,
} from '../../domain/opportunity.entity'

export interface OpportunityListFilters {
  status?: Opportunity['status']
  includeArchived?: boolean
  contactId?: string
  /** Set only when the actor is an AGENT — scopes results to properties they're responsible for. */
  responsavelId?: string
}

export interface OpportunityRepository {
  create(opportunity: NewOpportunity): Promise<Opportunity>
  findManyByTenant(tenantId: string, filters?: OpportunityListFilters): Promise<Opportunity[]>
  findById(id: string): Promise<Opportunity | null>
  update(id: string, changes: OpportunityUpdate): Promise<Opportunity>
  archive(id: string): Promise<Opportunity>
  delete(id: string): Promise<void>
  countByContact(tenantId: string, contactIds: readonly string[]): Promise<Map<string, number>>
  /** Whether the given agent has at least one opportunity on `contactId` through a property they own. */
  existsForAgent(tenantId: string, contactId: string, agentId: string): Promise<boolean>
}
