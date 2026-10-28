import type { AgendaReadActor } from '../types/read-actor'
import { isAgencyManager, isPropertyOwner } from '@server/auth/domain/roles'
import type { UserRole, User } from '@server/auth/domain/user.entity'

import type { AgendaEvent } from './agenda-event.entity'
import type { AgendaReadScope, AgendaEventAudience } from '../types/agenda-event'
import { ForbiddenError } from '@server/shared/errors'

export function resolveAgendaReadScope(actor: AgendaReadActor): AgendaReadScope {
  if (actor.actorRole === 'RENTER') {
    return { kind: 'linkedUser', userId: actor.actorUserId }
  }

  if (actor.actorRole === 'AGENT' || actor.actorRole === 'PROPERTY_OWNER') {
    return {
      kind: actor.actorRole === 'AGENT' ? 'agent' : 'owner',
      tenantId: actor.actorTenantId,
      userId: actor.actorUserId,
    }
  }

  return { kind: 'tenant', tenantId: actor.actorTenantId }
}

export function assertCanManageAgendaEvent(
  role: UserRole,
  userId: string | undefined,
  event: AgendaEvent,
): void {
  if (isAgencyManager(role)) return
  if (event.internal || event.audience === 'ALL_AGENTS') throw new ForbiddenError()
  if (
    (isPropertyOwner(role) || role === 'RENTER') &&
    event.responsibleId !== userId &&
    event.createdById !== userId
  ) {
    throw new ForbiddenError()
  }
  if (event.audience === 'ASSIGNED_AGENT' && (role !== 'AGENT' || event.responsibleId !== userId)) {
    throw new ForbiddenError()
  }
}

export function assertCanChooseAgendaAudience(
  role: UserRole,
  userId: string | undefined,
  audience: AgendaEventAudience | undefined,
  internal: boolean | undefined,
  responsibleId: string | undefined,
): void {
  if (isAgencyManager(role)) return
  if (internal || audience === 'ALL_AGENTS' || (responsibleId && responsibleId !== userId)) {
    throw new ForbiddenError()
  }
}

export function canLinkUserToAgendaEvent(
  user: Pick<User, 'tenantId' | 'role' | 'active' | 'membershipApprovedAt'>,
  eventTenantId: string,
): boolean {
  if (!user.active) return false
  if (user.role === 'RENTER') return true

  return user.tenantId === eventTenantId && user.membershipApprovedAt !== null
}
