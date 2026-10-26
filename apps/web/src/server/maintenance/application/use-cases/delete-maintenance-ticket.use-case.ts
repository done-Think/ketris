import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import type { MaintenanceTicketInput } from '../../types/use-case-inputs'
import { deleteTicket } from '../workflow'

export class DeleteMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  async execute(input: MaintenanceTicketInput): Promise<void> {
    await deleteTicket(this.repository, input, input.ticketId)
  }
}
