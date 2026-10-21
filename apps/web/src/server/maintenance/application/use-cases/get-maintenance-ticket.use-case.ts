import type { MaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../../types/maintenance-ticket-repository'
import { loadTicket } from '../workflow'

export class GetMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  execute(input: MaintenanceTicketInput) {
    return loadTicket(this.repository, input, input.ticketId)
  }
}
