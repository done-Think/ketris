import { MaintenancePropertyNotFoundError } from '../../domain/errors'
import type {
  MaintenanceTicket,
  MaintenanceTicketPriority,
} from '../../domain/maintenance-ticket.entity'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export interface CreateMaintenanceTicketInput {
  actorTenantId: string
  actorId: string
  actorName: string
  propertyId: string
  category: string
  priority: MaintenanceTicketPriority
  title: string
  description: string
}

export class CreateMaintenanceTicketUseCase {
  constructor(private readonly maintenanceTicketRepository: MaintenanceTicketRepository) {}

  async execute(input: CreateMaintenanceTicketInput): Promise<MaintenanceTicket> {
    const property = await this.maintenanceTicketRepository.findPropertyForTenant(
      input.actorTenantId,
      input.propertyId,
    )

    if (!property) {
      throw new MaintenancePropertyNotFoundError()
    }

    return this.maintenanceTicketRepository.create({
      tenantId: input.actorTenantId,
      propertyId: property.id,
      category: input.category,
      priority: input.priority,
      title: input.title,
      description: input.description,
      openedById: input.actorId,
      openedByName: input.actorName,
    })
  }
}
