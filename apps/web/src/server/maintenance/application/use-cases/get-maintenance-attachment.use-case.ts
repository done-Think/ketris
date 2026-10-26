import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { MaintenanceTicketNotFoundError } from '../../domain/errors'
import { assertTicketAccess } from '../../domain/maintenance-access-rules'
import { resolveMaintenanceMediaObject } from '../../domain/maintenance-attachment-rules'
import type { MaintenanceAttachmentObject } from '../../types/maintenance-ticket'
import type { GetMaintenanceAttachmentInput } from '../../types/use-case-inputs'
import type { MaintenanceAttachmentStoragePort } from '../ports/maintenance-attachment-storage.port'

export class GetMaintenanceAttachmentUseCase {
  constructor(
    private readonly repository: MaintenanceTicketRepository,
    private readonly attachmentStorage: MaintenanceAttachmentStoragePort,
  ) {}

  // Null when the attachment row exists but the stored object is gone.
  async execute({
    keyParts,
    ...actor
  }: GetMaintenanceAttachmentInput): Promise<MaintenanceAttachmentObject | null> {
    const media = resolveMaintenanceMediaObject(actor, keyParts)
    const ticket = await this.repository.findAttachmentTicket(actor, media.url)
    assertTicketAccess(actor, ticket)
    if (ticket.tenantId !== media.tenantId) throw new MaintenanceTicketNotFoundError()

    return this.attachmentStorage.download(media.objectKey)
  }
}
