import type { MaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../../types/maintenance-ticket-repository'
import { deleteTicket } from '../workflow'

export class DeleteMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(input: MaintenanceTicketInput) {
    await deleteTicket(this.repository, input, input.ticketId)
  }
}
