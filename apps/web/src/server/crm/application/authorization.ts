import { isAgencyManager, isAgencyStaff } from '@server/auth/domain/roles'
import type { Papel } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import { ContactNotFoundError, LeadNotFoundError, OpportunityNotFoundError } from '../domain/errors'
import type { OpportunityRepository } from './ports/opportunity-repository.port'
import type { PropertyLookupPort } from './ports/property-lookup.port'

export async function assertAgentOwnsProperty(
  propertyLookup: PropertyLookupPort,
  tenantId: string,
  propertyId: string,
  actorId: string,
  actorPapel: Papel,
): Promise<void> {
  if (isAgencyManager(actorPapel)) return
  if (actorPapel !== 'AGENT') throw new OpportunityNotFoundError()

  const responsavelId = await propertyLookup.findResponsavelId(tenantId, propertyId)

  if (responsavelId !== actorId) throw new OpportunityNotFoundError()
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
