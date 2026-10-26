import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import type { PublicMaintenanceTicket } from '../../types/maintenance-ticket'
import type { ActOnMaintenanceTicketInput } from '../../types/use-case-inputs'
import { toPublicMaintenanceTicket } from '../maintenance-ticket-response'
import { actOnTicket } from '../workflow'

export class ActOnMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  async execute({
    ticketId,
    action,
    ...actor
  }: ActOnMaintenanceTicketInput): Promise<PublicMaintenanceTicket> {
    return toPublicMaintenanceTicket(
      await actOnTicket(this.repository, actor, ticketId, action),
      actor,
    )
  }
}
