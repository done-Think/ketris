import type { MaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { loadTicket } from '../workflow'

export class ListMaintenanceTicketActivitiesUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(input: MaintenanceTicketInput) {
    const ticket = await loadTicket(this.repository, input, input.ticketId)
    return this.repository.findActivities(ticket.tenantId, ticket.id)
  }
}
