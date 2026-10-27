import type { ResolveMaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { publicTicket } from '../present-maintenance-ticket'
import { actOnTicket } from '../workflow'

export class ResolveMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(input: ResolveMaintenanceTicketInput) {
    return publicTicket(
      await actOnTicket(this.repository, input, input.ticketId, { action: 'complete' }),
      input,
    )
  }
}
