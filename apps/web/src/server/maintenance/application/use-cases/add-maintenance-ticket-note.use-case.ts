import { MaintenanceTicketNotFoundError } from '../../domain/errors'
import type { MaintenanceActivity } from '../../domain/maintenance-ticket.entity'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export interface AddMaintenanceTicketNoteInput {
  actorTenantId: string
  actorId: string
  actorName: string
  ticketId: string
  message: string
}

export class AddMaintenanceTicketNoteUseCase {
  constructor(private readonly maintenanceTicketRepository: MaintenanceTicketRepository) {}

  async execute(input: AddMaintenanceTicketNoteInput): Promise<MaintenanceActivity> {
    const existing = await this.maintenanceTicketRepository.findById(
      input.actorTenantId,
      input.ticketId,
    )

    if (!existing) {
      throw new MaintenanceTicketNotFoundError()
    }

    return this.maintenanceTicketRepository.addNote(input.actorTenantId, input.ticketId, {
      type: 'NOTA',
      message: input.message.trim(),
      authorId: input.actorId,
      authorName: input.actorName,
    })
  }
}
