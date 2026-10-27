import { ConflictError } from '@server/shared/errors'
import type { CreateMaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { publicTicket } from '../present-maintenance-ticket'
import { validateContract } from '../workflow'

export class CreateMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(input: CreateMaintenanceTicketInput) {
    const contract = await validateContract(
      this.repository,
      input,
      input.contractId,
      input.propertyId,
    )
    if (input.scheduledAt)
      throw new ConflictError('Defina um prestador antes de agendar o atendimento.')
    const ticket = await this.repository.create({
      tenantId: contract.tenantId,
      contractId: contract.id,
      propertyId: contract.propertyId,
      category: input.category,
      priority: input.priority,
      title: input.title,
      description: input.description,
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
      openedById: input.actorId,
      openedByName: input.actorName,
    })
    return publicTicket(ticket, input)
  }
}
