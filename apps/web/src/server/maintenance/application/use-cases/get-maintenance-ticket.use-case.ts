import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import type { PublicMaintenanceTicket } from '../../types/maintenance-ticket'
import type { MaintenanceTicketInput } from '../../types/use-case-inputs'
import { toPublicMaintenanceTicket } from '../maintenance-ticket-response'
import { loadTicket } from '../workflow'

export class GetMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  async execute(input: MaintenanceTicketInput): Promise<PublicMaintenanceTicket> {
    return toPublicMaintenanceTicket(
      await loadTicket(this.repository, input, input.ticketId),
      input,
    )
  }
}
