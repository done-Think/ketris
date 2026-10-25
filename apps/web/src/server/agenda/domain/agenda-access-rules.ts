import type { AgendaReadActor } from '../types/read-actor'
import { isAgencyManager, isPropertyOwner } from '@server/auth/domain/roles'
import type { Papel, User } from '@server/auth/domain/user.entity'

import type { AgendaEvent } from './agenda-event.entity'
import type { AgendaReadScope, AgendaEventAudience } from '../types/agenda-event'
import { ForbiddenError } from '@server/shared/errors'

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

export function canLinkUserToAgendaEvent(
  user: Pick<User, 'tenantId' | 'papel' | 'ativo' | 'vinculoAprovadoEm'>,
  eventTenantId: string,
): boolean {
  if (!user.ativo) return false
  if (user.papel === 'RENTER') return true

  return user.tenantId === eventTenantId && user.vinculoAprovadoEm !== null
}
