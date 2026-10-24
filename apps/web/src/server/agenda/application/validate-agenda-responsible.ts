import { isAgencyStaff } from '@server/auth/domain/roles'
import type { UserRepository } from '@server/auth/application/ports/user-repository.port'
import { AgendaResponsibleNotFoundError } from '../domain/errors'

export async function validateAgendaResponsible(
  users: UserRepository,
  tenantId: string,
  responsibleId: string,
  agentOnly: boolean,
): Promise<void> {
  const user = await users.findById(responsibleId)
  if (
    !user ||
    user.tenantId !== tenantId ||
    !user.ativo ||
    !isAgencyStaff(user.papel) ||
    (agentOnly && (user.papel !== 'AGENT' || !user.vinculoAprovadoEm))
  )
    throw new AgendaResponsibleNotFoundError()
}
