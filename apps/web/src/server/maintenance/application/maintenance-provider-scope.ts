import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'
import { assertCanDefineProvider } from '../domain/maintenance-policy'
import type { MaintenanceActor } from '../types/maintenance-ticket'
import { loadTicket } from './maintenance-ticket-context'
import type { MaintenanceTicketRepository } from './ports/maintenance-ticket-repository.port'

export async function maintenanceProviderTenant(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId?: string,
) {
  if (!ticketId) {
    if (!isAgencyManager(actor.actorPapel)) throw new ForbiddenError()
    return actor.actorTenantId
  }
  const ticket = await loadTicket(repository, actor, ticketId)
  if (!isAgencyManager(actor.actorPapel)) assertCanDefineProvider(actor, ticket)
  return ticket.tenantId
}
