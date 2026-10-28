import { activity } from '../domain/maintenance-activity'
import { assertPermission } from '../domain/maintenance-policy'
import type { MaintenanceActor } from '../types/maintenance-ticket'
import { loadTicket } from './maintenance-ticket-context'
import type { MaintenanceTicketRepository } from './ports/maintenance-ticket-repository.port'

export async function deleteTicket(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId: string,
) {
  const ticket = await loadTicket(repository, actor, ticketId)
  assertPermission(actor, ticket, 'delete')
  return repository.mutate(
    ticket,
    { deletedAt: new Date(), deletedById: actor.actorId },
    activity(actor, 'DELETION', 'Chamado arquivado.', { status: ticket.status }, 'TICKET_ARCHIVED'),
  )
}
