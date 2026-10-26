import type { MaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { publicTicket } from '../present-maintenance-ticket'
import { loadTicket } from '../workflow'

export class GetMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(input: MaintenanceTicketInput) {
    return publicTicket(await loadTicket(this.repository, input, input.ticketId), input)
  }
}
