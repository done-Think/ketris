import { MaintenanceTicketNotFoundError } from '../../domain/errors'
import type { MaintenanceActivity } from '../../domain/maintenance-ticket.entity'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class ListMaintenanceTicketActivitiesUseCase {
  constructor(private readonly maintenanceTicketRepository: MaintenanceTicketRepository) {}

  async execute(input: {
    actorTenantId: string
    ticketId: string
  }): Promise<MaintenanceActivity[]> {
    const existing = await this.maintenanceTicketRepository.findById(
      input.actorTenantId,
      input.ticketId,
    )

    if (!existing) {
      throw new MaintenanceTicketNotFoundError()
    }

    return this.maintenanceTicketRepository.findActivities(input.actorTenantId, input.ticketId)
  }
}
