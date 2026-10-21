import type { CreateMaintenanceTicketInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../../types/maintenance-ticket-repository'
import { validateContract } from '../workflow'
import { ConflictError } from '@server/shared/errors'

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
    return this.repository.create({
      tenantId: input.actorTenantId,
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
  }
}
