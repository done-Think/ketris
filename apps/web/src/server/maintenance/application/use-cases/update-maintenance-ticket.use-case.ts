import type { UpdateMaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { publicTicket } from '../present-maintenance-ticket'
import { updateTicket } from '../workflow'

export class UpdateMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(input: UpdateMaintenanceTicketInput) {
    const ticket = await updateTicket(this.repository, input, input.ticketId, {
      propertyId: input.propertyId,
      contractId: input.contractId,
      category: input.category,
      priority: input.priority,
      title: input.title,
      description: input.description,
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
    })
    return publicTicket(ticket, input)
  }
}
