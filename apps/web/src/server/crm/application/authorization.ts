import type { Papel } from '@server/auth/domain/user.entity'

import { ContactNotFoundError, OpportunityNotFoundError } from '../domain/errors'
import type { OpportunityRepository } from './ports/opportunity-repository.port'
import type { PropertyLookupPort } from './ports/property-lookup.port'

/**
 * AGENT actors only reach opportunities tied to properties they're `responsavelId` for.
 * ADMIN/OWNER are unrestricted. Throws the same opaque not-found used for cross-tenant access,
 * so an AGENT can't distinguish "doesn't exist" from "isn't yours".
 */
export async function assertAgentOwnsProperty(
  propertyLookup: PropertyLookupPort,
  tenantId: string,
  propertyId: string,
  actorId: string,
  actorPapel: Papel,
): Promise<void> {
  if (actorPapel !== 'AGENT') return

  const responsavelId = await propertyLookup.findResponsavelId(tenantId, propertyId)

  if (responsavelId !== actorId) throw new OpportunityNotFoundError()
}

/** Same rule as above, applied to contacts (reachable only through an owned opportunity). */
export async function assertAgentOwnsContact(
  opportunityRepository: OpportunityRepository,
  tenantId: string,
  contactId: string,
  actorId: string,
  actorPapel: Papel,
): Promise<void> {
  if (actorPapel !== 'AGENT') return

  const hasAccess = await opportunityRepository.existsForAgent(tenantId, contactId, actorId)

  if (!hasAccess) throw new ContactNotFoundError()
}
