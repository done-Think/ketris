import { ConflictError } from '@server/shared/errors'

import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import type { PublicMaintenanceTicket } from '../../types/maintenance-ticket'
import type { CreateMaintenanceTicketInput } from '../../types/use-case-inputs'
import { toPublicMaintenanceTicket } from '../maintenance-ticket-response'
import { validateContract } from '../workflow'

export class CreateMaintenanceTicketUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}

  async execute(input: CreateMaintenanceTicketInput): Promise<PublicMaintenanceTicket> {
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

    return toPublicMaintenanceTicket(ticket, input)
  }
}
