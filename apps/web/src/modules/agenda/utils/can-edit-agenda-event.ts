import type { AgendaActor } from '../types/agenda-access'
import type { AgendaEvent } from '../types/agenda-event'

export function canEditAgendaEvent(actor: AgendaActor, event: AgendaEvent | null): boolean {
  if (!event || !actor.userId || !actor.role) return false
  if (actor.role === 'OWNER') return true
  if (event.internal || event.audience === 'ALL_AGENTS') return false
  if (
    (actor.role === 'PROPERTY_OWNER' || actor.role === 'RENTER') &&
    event.responsibleId !== actor.userId &&
    event.createdById !== actor.userId
  )
    return false
  if (event.audience === 'ASSIGNED_AGENT')
    return actor.role === 'AGENT' && event.responsibleId === actor.userId
  return true
}
