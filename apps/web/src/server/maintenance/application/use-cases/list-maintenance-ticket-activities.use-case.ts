import type { MaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../../types/maintenance-ticket-repository'
import { loadTicket } from '../workflow'

export class ListMaintenanceTicketActivitiesUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(input: MaintenanceTicketInput) {
    await loadTicket(this.repository, input, input.ticketId)
    return this.repository.findActivities(input.actorTenantId, input.ticketId)
  }
}
