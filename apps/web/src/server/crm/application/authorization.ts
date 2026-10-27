import { isAgencyManager, isAgencyStaff } from '@server/auth/domain/roles'
import type { Papel } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import { ContactNotFoundError, LeadNotFoundError, OpportunityNotFoundError } from '../domain/errors'
import type { Opportunity } from '../domain/opportunity.entity'
import type { OpportunityRepository } from './ports/opportunity-repository.port'

export function assertOpportunityAccess(
  opportunity: Pick<Opportunity, 'responsibleId'>,
  actorId: string,
  actorPapel: Papel,
): void {
  if (isAgencyManager(actorPapel)) return
  if (actorPapel === 'AGENT' && opportunity.responsibleId === actorId) return

  throw new OpportunityNotFoundError()
}

export async function assertAgentOwnsContact(
  opportunityRepository: OpportunityRepository,
  tenantId: string,
  contactId: string,
  actorId: string,
  actorPapel: Papel,
  createdById?: string | null,
): Promise<void> {
  if (isAgencyManager(actorPapel)) return
  if (actorPapel !== 'AGENT') throw new ContactNotFoundError()
  if (createdById === actorId) return

  const hasAccess = await opportunityRepository.existsForAgent(tenantId, contactId, actorId)

  if (!hasAccess) throw new ContactNotFoundError()
}

export function assertLeadAccess(responsavelId: string, actorId: string, actorPapel: Papel): void {
  if (isAgencyManager(actorPapel)) return
  if (actorPapel === 'AGENT' && responsavelId === actorId) return

  throw new LeadNotFoundError()
}

export function assertCrmAccess(actorPapel: Papel): void {
  if (!isAgencyStaff(actorPapel)) {
    throw new ForbiddenError('Só a equipe da imobiliária acessa o CRM.')
  }
}
