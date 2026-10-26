import {
  MaintenanceAttachmentValidationError,
  MaintenanceTicketNotFoundError,
} from '../../domain/errors'
import { assertPermission } from '../../domain/maintenance-policy'
import type { CompleteMaintenanceUploadInput } from '../../types/maintenance-upload'
import { maintenanceAttachmentKey } from '../maintenance-attachment-key'
import { loadTicket } from '../maintenance-ticket-context'
import type {
  MaintenanceDirectUploadStorage,
  MaintenanceUploadTickets,
} from '../ports/maintenance-direct-upload.port'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class CompleteMaintenanceAttachmentUploadUseCase {
  constructor(
    private readonly repository: MaintenanceTicketRepository,
    private readonly storage: MaintenanceDirectUploadStorage,
    private readonly tickets: MaintenanceUploadTickets,
  ) {}
  async execute(input: CompleteMaintenanceUploadInput) {
    const ticket = await loadTicket(this.repository, input, input.ticketId)
    assertPermission(input, ticket, 'collaborate')
    const descriptor = await this.tickets.verify(input.token)
    if (
      descriptor.actorId !== input.actorId ||
      descriptor.ticketId !== ticket.id ||
      descriptor.tenantId !== ticket.tenantId
    )
      throw new MaintenanceTicketNotFoundError()
    const key = maintenanceAttachmentKey(descriptor)
    const stored = await this.storage.inspect(key)
    if (
      stored.size !== descriptor.size ||
      stored.contentType !== descriptor.contentType ||
      stored.sha256 !== descriptor.sha256
    )
      throw new MaintenanceAttachmentValidationError('O arquivo enviado diverge da autorização.')
    return this.repository.addAttachment(ticket, {
      uploadId: descriptor.uploadId,
      name: descriptor.filename,
      url: `/api/maintenance/media/${key}`,
      authorId: input.actorId,
      authorName: input.actorName,
    })
  }
}
