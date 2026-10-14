import type { AddMaintenanceTicketNoteInput } from '../../types/use-case-inputs'
import type { MaintenanceTicketRepository } from '../../types/maintenance-ticket-repository'
import { loadTicket } from '../workflow'
import { assertPermission } from '../authorization'
import { ConflictError } from '@server/shared/errors'

export class AddMaintenanceTicketNoteUseCase {
  constructor(private readonly repository: MaintenanceTicketRepository) {}
  async execute(input: AddMaintenanceTicketNoteInput) {
    const ticket = await loadTicket(this.repository, input, input.ticketId)
    assertPermission(input, ticket, 'collaborate')
    if (!input.message.trim()) throw new ConflictError('Informe o comentario.')
    return this.repository.addNote(ticket, {
      type: 'NOTA',
      message: input.message.trim(),
      authorId: input.actorId,
      authorName: input.actorName,
    })
  }
}
