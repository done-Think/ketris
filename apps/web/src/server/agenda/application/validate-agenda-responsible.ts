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
    user.papel === 'RENTER' ||
    (agentOnly && (user.papel !== 'AGENT' || !user.vinculoAprovadoEm))
  )
    throw new AgendaResponsibleNotFoundError()
}
