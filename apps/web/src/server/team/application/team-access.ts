import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { TeamActor } from '../types/team'
import type { TeamRepository } from './ports/team-repository.port'

export function assertTeamManager(actor: TeamActor): void {
  if (!isAgencyManager(actor.actorPapel))
    throw new ForbiddenError('Apenas a gestão da imobiliária gerencia a equipe.')
}

export async function teamActorIdentity(
  repository: TeamRepository,
  actor: TeamActor,
): Promise<{ id: string; name: string }> {
  const user = await repository.findStaffUser(actor.actorTenantId, actor.actorId)
  if (!user) throw new ForbiddenError()

  return { id: user.id, name: user.name }
}
