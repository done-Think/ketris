import type {
  AgendaEvent,
  AgendaEventChanges,
  AgendaEventLinks,
  AgendaEventListFilters,
  AgendaEventReschedule,
  AgendaReadScope,
  NewAgendaEvent,
} from '../../domain/agenda-event.entity'

export interface AgendaEventRepository {
  /**
   * Creates the event and its owner/participant links atomically. Throws
   * AgendaEventUserLinkUnavailableError (rolling everything back) when an e-mail can't be linked.
   */
  create(event: NewAgendaEvent, links?: AgendaEventLinks): Promise<AgendaEvent>
  list(filters: AgendaEventListFilters): Promise<AgendaEvent[]>
  findByScopeAndId(scope: AgendaReadScope, id: string): Promise<AgendaEvent | null>
  findByTenantAndId(tenantId: string, id: string): Promise<AgendaEvent | null>
  /** Same atomicity and link validation as create. */
  update(
    tenantId: string,
    id: string,
    changes: AgendaEventChanges,
    links?: AgendaEventLinks,
  ): Promise<AgendaEvent | null>
  reschedule(
    tenantId: string,
    id: string,
    reschedule: AgendaEventReschedule,
  ): Promise<AgendaEvent | null>
  cancel(tenantId: string, id: string): Promise<AgendaEvent | null>
  hasOverlap(
    tenantId: string,
    responsavelId: string,
    inicio: Date,
    fim: Date,
    excludeEventId?: string,
  ): Promise<boolean>
}
