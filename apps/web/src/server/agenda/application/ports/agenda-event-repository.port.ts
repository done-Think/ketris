import type { AgendaCancellation } from '../../types/audit'
import type { AgendaEvent } from '../../domain/agenda-event.entity'
import type {
  AgendaEventChanges,
  AgendaEventLinks,
  AgendaEventListFilters,
  AgendaEventReschedule,
  AgendaReadScope,
  NewAgendaEvent,
} from '../../types/agenda-event'

export interface AgendaEventRepository {
  create(event: NewAgendaEvent, links?: AgendaEventLinks): Promise<AgendaEvent>
  list(filters: AgendaEventListFilters): Promise<AgendaEvent[]>
  findByScopeAndId(scope: AgendaReadScope, id: string): Promise<AgendaEvent | null>
  findByTenantAndId(tenantId: string, id: string): Promise<AgendaEvent | null>
  update(
    tenantId: string,
    id: string,
    changes: AgendaEventChanges,
    links?: AgendaEventLinks,
    actorUserId?: string,
  ): Promise<AgendaEvent | null>
  reschedule(
    tenantId: string,
    id: string,
    reschedule: AgendaEventReschedule,
    actorUserId?: string,
  ): Promise<AgendaEvent | null>
  cancel(
    tenantId: string,
    id: string,
    cancellation: AgendaCancellation,
  ): Promise<AgendaEvent | null>
  hasOverlap(
    tenantId: string,
    responsibleId: string,
    start: Date,
    end: Date,
    excludeEventId?: string,
  ): Promise<boolean>
}
