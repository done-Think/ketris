import { isAgencyManager } from '@server/auth/domain/roles'
import type { UserRole } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import { InvalidOpportunityResponsibleError } from '../domain/errors'
import type { ResponsibleLookupPort } from './ports/responsible-lookup.port'

export async function resolveOpportunityResponsible(
  lookup: ResponsibleLookupPort,
  input: { tenantId: string; actorId: string; actorRole: UserRole; requestedId?: string | null },
): Promise<string> {
  const responsibleId = input.requestedId ?? input.actorId
  if (responsibleId !== input.actorId && !isAgencyManager(input.actorRole))
    throw new ForbiddenError('Só o responsável pela imobiliária escolhe outro responsável.')
  if (!(await lookup.findActiveStaffName(input.tenantId, responsibleId)))
    throw new InvalidOpportunityResponsibleError()

  return responsibleId
}
