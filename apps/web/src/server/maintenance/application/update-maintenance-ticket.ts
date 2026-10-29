import { ConflictError, ForbiddenError } from '@server/shared/errors'
import { activity } from '../domain/maintenance-activity'
import { assertPermission } from '../domain/maintenance-policy'
import type {
  MaintenanceActor,
  MaintenanceTicket,
  MaintenanceTicketUpdate,
} from '../types/maintenance-ticket'
import { loadTicket, validateContract } from './maintenance-ticket-context'
import type { MaintenanceTicketRepository } from './ports/maintenance-ticket-repository.port'

export async function updateTicket(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId: string,
  changes: MaintenanceTicketUpdate,
) {
  const ticket = await loadTicket(repository, actor, ticketId)
  assertPermission(actor, ticket, 'edit')
  if (changes.scheduledAt !== undefined) assertPermission(actor, ticket, 'schedule')
  if (
    (changes.contractId && changes.contractId !== ticket.contractId) ||
    (changes.propertyId && changes.propertyId !== ticket.propertyId)
  ) {
    if (!changes.contractId && !ticket.contractId)
      throw new ConflictError('Selecione o contrato do chamado.')
    if (
      actor.actorRole === 'RENTER' &&
      ((changes.contractId && changes.contractId !== ticket.contractId) ||
        (changes.propertyId && changes.propertyId !== ticket.propertyId))
    )
      throw new ForbiddenError()
    const contract = await validateContract(
      repository,
      actor,
      changes.contractId ?? ticket.contractId!,
      changes.propertyId,
    )
    changes = { ...changes, contractId: contract.id, propertyId: contract.propertyId }
  }
  const changed = Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  )
  return repository.mutate(
    ticket,
    changes,
    activity(
      actor,
      'EDIT',
      'Dados do chamado atualizados.',
      {
        before: Object.fromEntries(
          Object.keys(changed).map((key) => [key, ticket[key as keyof MaintenanceTicket]]),
        ),
        after: changed,
      },
      'TICKET_UPDATED',
    ),
  )
}
