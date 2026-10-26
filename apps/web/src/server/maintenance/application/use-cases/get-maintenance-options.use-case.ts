import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import type { MaintenanceActor, MaintenanceOptions } from '../../types/maintenance-ticket'

export class GetMaintenanceOptionsUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  execute(actor: MaintenanceActor): Promise<MaintenanceOptions> {
    return this.repository.options(actor)
  }
}
