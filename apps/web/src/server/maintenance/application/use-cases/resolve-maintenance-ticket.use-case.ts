import type { ResolveMaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../../types/maintenance-ticket-repository'
import { actOnTicket } from '../workflow'

export class ResolveMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  execute(input: ResolveMaintenanceTicketInput) {
    return actOnTicket(this.repository, input, input.ticketId, { action: 'complete' })
  }
}
