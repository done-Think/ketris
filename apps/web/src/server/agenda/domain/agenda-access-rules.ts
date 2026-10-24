import { isAgencyManager, isPropertyOwner } from '@server/auth/domain/roles'
import type { Papel, User } from '@server/auth/domain/user.entity'

import type { AgendaReadScope, AgendaEvent, AgendaEventAudience } from './agenda-event.entity'
import { ForbiddenError } from '@server/shared/errors'

export interface AgendaReadActor {
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
}

export function resolveAgendaReadScope(actor: AgendaReadActor): AgendaReadScope {
  if (actor.actorPapel === 'RENTER') {
    return { kind: 'linkedUser', userId: actor.actorUserId }
  }

  if (actor.actorPapel === 'AGENT' || actor.actorPapel === 'PROPERTY_OWNER') {
    return {
      kind: actor.actorPapel === 'AGENT' ? 'agent' : 'owner',
      tenantId: actor.actorTenantId,
      userId: actor.actorUserId,
    }
  }

  return { kind: 'tenant', tenantId: actor.actorTenantId }
}

export function assertCanManageAgendaEvent(
  papel: Papel,
  userId: string | undefined,
  event: AgendaEvent,
): void {
  if (isAgencyManager(papel)) return
  if (event.interno || event.destino === 'ALL_AGENTS') throw new ForbiddenError()
  if (
    (isPropertyOwner(papel) || papel === 'RENTER') &&
    event.responsavelId !== userId &&
    event.criadoPorId !== userId
  ) {
    throw new ForbiddenError()
  }
  if (event.destino === 'ASSIGNED_AGENT' && (papel !== 'AGENT' || event.responsavelId !== userId)) {
    throw new ForbiddenError()
  }
}

export function assertCanChooseAgendaAudience(
  papel: Papel,
  userId: string | undefined,
  audience: AgendaEventAudience | undefined,
  internal: boolean | undefined,
  responsibleId: string | undefined,
): void {
  if (isAgencyManager(papel)) return
  if (internal || audience === 'ALL_AGENTS' || (responsibleId && responsibleId !== userId)) {
    throw new ForbiddenError()
  }
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
