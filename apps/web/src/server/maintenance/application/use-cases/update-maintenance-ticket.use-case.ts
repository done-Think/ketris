import type { UpdateMaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../../types/maintenance-ticket-repository'
import { updateTicket } from '../workflow'

export class UpdateMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  execute(input: UpdateMaintenanceTicketInput) {
    return updateTicket(this.repository, input, input.ticketId, {
      propertyId: input.propertyId,
      contractId: input.contractId,
      category: input.category,
      priority: input.priority,
      title: input.title,
      description: input.description,
    })
  }
}
