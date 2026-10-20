import type { Papel, User } from '@server/auth/domain/user.entity'

import type { AgendaReadScope } from './agenda-event.entity'
import { AgendaRenterForbiddenError } from './errors'

export interface AgendaReadActor {
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
}

/** Create, update, reschedule and cancel stay restricted to the agency staff. */
export function assertCanManageAgenda(papel: Papel): void {
  if (papel === 'RENTER') {
    throw new AgendaRenterForbiddenError()
  }
}

/**
 * Staff reads every event of its own tenant (shared team agenda). A RENTER lives in the shared
 * renters tenant, so its reads are scoped by an explicit link to its own user — owner or
 * participant — never by its tenantId.
 */
export function resolveAgendaReadScope(actor: AgendaReadActor): AgendaReadScope {
  if (actor.actorPapel === 'RENTER') {
    return { kind: 'linkedUser', userId: actor.actorUserId }
  }

  return { kind: 'tenant', tenantId: actor.actorTenantId }
}

/**
 * Who can be linked to an event as owner or participant: an active RENTER (from any tenant,
 * since renters live in the shared renters tenant) or an active, approved staff member of the
 * event's own tenant.
 */
export function canLinkUserToAgendaEvent(
  user: Pick<User, 'tenantId' | 'papel' | 'ativo' | 'vinculoAprovadoEm'>,
  eventTenantId: string,
): boolean {
  if (!user.ativo) return false
  if (user.papel === 'RENTER') return true

  return user.tenantId === eventTenantId && user.vinculoAprovadoEm !== null
}
