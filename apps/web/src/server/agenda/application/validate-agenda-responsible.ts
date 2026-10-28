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
    !user.active ||
    !isAgencyStaff(user.role) ||
    (agentOnly && (user.role !== 'AGENT' || !user.membershipApprovedAt))
  )
    throw new AgendaResponsibleNotFoundError()
}
