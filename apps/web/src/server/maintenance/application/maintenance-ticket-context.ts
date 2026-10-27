import { MaintenancePropertyNotFoundError } from '../domain/errors'
import { assertTicketAccess, canAccessContract, permissionsFor } from '../domain/maintenance-policy'
import type { MaintenanceActor } from '../types/maintenance-ticket'
import type { MaintenanceTicketRepository } from './ports/maintenance-ticket-repository.port'

export async function loadTicket(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  ticketId: string,
) {
  const ticket = await repository.findById(actor, ticketId)
  assertTicketAccess(actor, ticket)
  return { ...ticket, permissions: permissionsFor(actor, ticket) }
}

export async function validateContract(
  repository: MaintenanceTicketRepository,
  actor: MaintenanceActor,
  contractId: string,
  propertyId?: string,
) {
  const contract = await repository.findContract(actor, contractId)
  if (
    !contract ||
    (propertyId && propertyId !== contract.propertyId) ||
    !canAccessContract(actor, contract)
  ) {
    throw new MaintenancePropertyNotFoundError()
  }
  return contract
}
