import { MaintenanceTicketNotFoundError } from '../../domain/errors'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class DeleteMaintenanceTicketUseCase {
  constructor(private readonly maintenanceTicketRepository: MaintenanceTicketRepository) {}

  async execute(input: { actorTenantId: string; ticketId: string }): Promise<void> {
    const existing = await this.maintenanceTicketRepository.findById(
      input.actorTenantId,
      input.ticketId,
    )

    if (!existing) {
      throw new MaintenanceTicketNotFoundError()
    }

    await this.maintenanceTicketRepository.delete(input.actorTenantId, input.ticketId)
  }
}
