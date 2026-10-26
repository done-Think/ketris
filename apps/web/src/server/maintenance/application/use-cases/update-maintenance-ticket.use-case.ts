import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import type { PublicMaintenanceTicket } from '../../types/maintenance-ticket'
import type { UpdateMaintenanceTicketInput } from '../../types/use-case-inputs'
import { toPublicMaintenanceTicket } from '../maintenance-ticket-response'
import { updateTicket } from '../workflow'

export class UpdateMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  async execute(input: UpdateMaintenanceTicketInput): Promise<PublicMaintenanceTicket> {
    const ticket = await updateTicket(this.repository, input, input.ticketId, {
      propertyId: input.propertyId,
      contractId: input.contractId,
      category: input.category,
      priority: input.priority,
      title: input.title,
      description: input.description,
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
    })

    return toPublicMaintenanceTicket(ticket, input)
  }
}
