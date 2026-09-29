import {
  MaintenancePropertyNotFoundError,
  MaintenanceTicketNotFoundError,
} from '../../domain/errors'
import type {
  MaintenanceTicket,
  MaintenanceTicketPriority,
} from '../../domain/maintenance-ticket.entity'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export interface UpdateMaintenanceTicketInput {
  actorTenantId: string
  ticketId: string
  propertyId?: string
  category?: string
  priority?: MaintenanceTicketPriority
  title?: string
  description?: string
}

export class UpdateMaintenanceTicketUseCase {
  constructor(private readonly maintenanceTicketRepository: MaintenanceTicketRepository) {}

  async execute(input: UpdateMaintenanceTicketInput): Promise<MaintenanceTicket> {
    const existing = await this.maintenanceTicketRepository.findById(
      input.actorTenantId,
      input.ticketId,
    )

    if (!existing) {
      throw new MaintenanceTicketNotFoundError()
    }

    if (input.propertyId) {
      const property = await this.maintenanceTicketRepository.findPropertyForTenant(
        input.actorTenantId,
        input.propertyId,
      )

      if (!property) {
        throw new MaintenancePropertyNotFoundError()
      }
    }

    return this.maintenanceTicketRepository.update(input.actorTenantId, input.ticketId, {
      propertyId: input.propertyId,
      category: input.category,
      priority: input.priority,
      title: input.title,
      description: input.description,
    })
  }
}
