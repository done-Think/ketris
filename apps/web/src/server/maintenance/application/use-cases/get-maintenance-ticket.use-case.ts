import { MaintenanceTicketNotFoundError } from '../../domain/errors'
import type { MaintenanceTicket } from '../../domain/maintenance-ticket.entity'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class GetMaintenanceTicketUseCase {
  constructor(private readonly maintenanceTicketRepository: MaintenanceTicketRepository) {}

  async execute(input: { actorTenantId: string; ticketId: string }): Promise<MaintenanceTicket> {
    const ticket = await this.maintenanceTicketRepository.findById(
      input.actorTenantId,
      input.ticketId,
    )

    if (!ticket) {
      throw new MaintenanceTicketNotFoundError()
    }

    return ticket
  }
}
