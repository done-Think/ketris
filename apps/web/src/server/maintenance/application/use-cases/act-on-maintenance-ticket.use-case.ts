import type { MaintenanceActionInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { publicTicket } from '../present-maintenance-ticket'
import { actOnTicket } from '../workflow'

export class ActOnMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  async execute(input: MaintenanceActionInput) {
    const ticket = await actOnTicket(this.repository, input, input.ticketId, input.action)
    return publicTicket(ticket, input)
  }
}
