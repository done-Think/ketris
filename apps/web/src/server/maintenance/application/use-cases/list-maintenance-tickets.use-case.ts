import type {
  MaintenanceTicketListFilters,
  MaintenanceTicketListResult,
} from '../../domain/maintenance-ticket.entity'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class ListMaintenanceTicketsUseCase {
  constructor(private readonly maintenanceTicketRepository: MaintenanceTicketRepository) {}

  execute(filters: MaintenanceTicketListFilters): Promise<MaintenanceTicketListResult> {
    return this.maintenanceTicketRepository.findMany(filters)
  }
}
