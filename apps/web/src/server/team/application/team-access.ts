import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { TeamActor } from '../types/team'
import type { TeamRepository } from './ports/team-repository.port'

// Owners of personal and independent-broker accounts are OWNER too, so the account type decides.
export async function assertTeamManager(
  repository: TeamRepository,
  actor: TeamActor,
): Promise<void> {
  if (
    !isAgencyManager(actor.actorRole) ||
    (await repository.findTenantAccountType(actor.actorTenantId)) !== 'AGENCY'
  )
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
