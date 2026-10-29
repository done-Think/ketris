import { ConflictError } from '@server/shared/errors'
import type { AddMaintenanceTicketNoteInput } from '../../types/use-case-inputs'
import { assertPermission } from '../authorization'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { loadTicket } from '../workflow'

export class AddMaintenanceTicketNoteUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(input: AddMaintenanceTicketNoteInput) {
    const ticket = await loadTicket(this.repository, input, input.ticketId)
    assertPermission(input, ticket, 'comment')
    if (!input.message.trim()) throw new ConflictError('Informe o comentario.')
    return this.repository.addNote(ticket, {
      type: 'NOTE',
      message: input.message.trim(),
      authorId: input.actorId,
      authorName: input.actorName,
    })
  }
}
