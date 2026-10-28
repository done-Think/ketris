import { isAgencyManager, isAgencyStaff } from '@server/auth/domain/roles'
import type { UserRole } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import { ContactNotFoundError, LeadNotFoundError, OpportunityNotFoundError } from '../domain/errors'
import type { Opportunity } from '../domain/opportunity.entity'
import type { OpportunityRepository } from './ports/opportunity-repository.port'

export function assertOpportunityAccess(
  opportunity: Pick<Opportunity, 'responsibleId'>,
  actorId: string,
  actorRole: UserRole,
): void {
  if (isAgencyManager(actorRole)) return
  if (actorRole === 'AGENT' && opportunity.responsibleId === actorId) return

  throw new OpportunityNotFoundError()
}

export async function assertAgentOwnsContact(
  opportunityRepository: OpportunityRepository,
  tenantId: string,
  contactId: string,
  actorId: string,
  actorRole: UserRole,
  createdById?: string | null,
): Promise<void> {
  if (isAgencyManager(actorRole)) return
  if (actorRole !== 'AGENT') throw new ContactNotFoundError()
  if (createdById === actorId) return

  const hasAccess = await opportunityRepository.existsForAgent(tenantId, contactId, actorId)

  if (!hasAccess) throw new ContactNotFoundError()
}

export function assertLeadAccess(
  responsibleId: string,
  actorId: string,
  actorRole: UserRole,
): void {
  if (isAgencyManager(actorRole)) return
  if (actorRole === 'AGENT' && responsibleId === actorId) return

  throw new LeadNotFoundError()
}

export function assertCrmAccess(actorRole: UserRole): void {
  if (!isAgencyStaff(actorRole)) {
    throw new ForbiddenError('Só a equipe da imobiliária acessa o CRM.')
  }
}
