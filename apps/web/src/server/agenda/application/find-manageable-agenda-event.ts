import type { Papel } from '@server/auth/domain/user.entity'

import type { AgendaEvent } from '../domain/agenda-event.entity'
import type { AgendaEventRepository } from './ports/agenda-event-repository.port'

export interface AgendaManageActor {
  actorTenantId: string
  actorUserId?: string
  actorPapel: Papel
}

export function findManageableAgendaEvent(
  repository: Pick<AgendaEventRepository, 'findByScopeAndId' | 'findByTenantAndId'>,
  actor: AgendaManageActor,
  id: string,
) {
  if (actor.actorPapel === 'RENTER') {
    return repository.findByScopeAndId({ kind: 'linkedUser', userId: actor.actorUserId ?? '' }, id)
  }

  return repository.findByTenantAndId(actor.actorTenantId, id)
}

export function manageableAgendaEventTenantId(actor: AgendaManageActor, event: AgendaEvent) {
  return actor.actorPapel === 'RENTER' ? event.tenantId : actor.actorTenantId
}
