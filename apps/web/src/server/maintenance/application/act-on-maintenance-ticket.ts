import { ForbiddenError } from '@server/shared/errors'
import { planMaintenanceAction } from '../domain/maintenance-action'
import { assertAdmin } from '../domain/maintenance-policy'
import type { MaintenanceAction, MaintenanceActor } from '../types/maintenance-ticket'
import { loadTicket, validateContract } from './maintenance-ticket-context'
import type { MaintenanceTicketRepository } from './ports/maintenance-ticket-repository.port'

export async function actOnTicket(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId: string,
  action: MaintenanceAction,
) {
  const ticket = await loadTicket(repository, actor, ticketId)
  if (action.action === 'linkContract') {
    assertAdmin(actor)
    await validateContract(repository, actor, action.contractId, ticket.propertyId)
  }
  const plan = planMaintenanceAction(actor, ticket, action)
  if (plan.changes.responsibleId) {
    const user = await repository.findUser(actor.actorTenantId, plan.changes.responsibleId)
    if (!user || !['OWNER', 'AGENT', 'PROPERTY_OWNER'].includes(user.role))
      throw new ForbiddenError('Responsavel invalido para esta corretora.')
  }
  return plan.request
    ? repository.mutate(ticket, plan.changes, plan.activity, plan.request)
    : repository.mutate(ticket, plan.changes, plan.activity)
}
