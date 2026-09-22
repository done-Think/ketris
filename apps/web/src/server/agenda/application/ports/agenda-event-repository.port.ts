import type {
  AgendaEvent,
  AgendaEventChanges,
  AgendaEventListFilters,
  AgendaEventReschedule,
  NewAgendaEvent,
} from '../../domain/agenda-event.entity'

export interface AgendaEventRepository {
  create(event: NewAgendaEvent): Promise<AgendaEvent>
  list(filters: AgendaEventListFilters): Promise<AgendaEvent[]>
  findByTenantAndId(tenantId: string, id: string): Promise<AgendaEvent | null>
  update(tenantId: string, id: string, changes: AgendaEventChanges): Promise<AgendaEvent | null>
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
