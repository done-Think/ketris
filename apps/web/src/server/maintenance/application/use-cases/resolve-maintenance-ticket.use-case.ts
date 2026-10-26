import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import type { PublicMaintenanceTicket } from '../../types/maintenance-ticket'
import type { ResolveMaintenanceTicketInput } from '../../types/use-case-inputs'
import { toPublicMaintenanceTicket } from '../maintenance-ticket-response'
import { actOnTicket } from '../workflow'

export class ResolveMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  async execute(input: ResolveMaintenanceTicketInput): Promise<PublicMaintenanceTicket> {
    const ticket = await actOnTicket(this.repository, input, input.ticketId, {
      action: 'complete',
    })

    return toPublicMaintenanceTicket(ticket, input)
  }
}
