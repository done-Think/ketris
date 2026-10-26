import type { MaintenanceActor } from '../../types/maintenance-ticket'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class ListMaintenanceOptionsUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  execute(actor: MaintenanceActor) {
    return this.repository.options(actor)
  }
}
