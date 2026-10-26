import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { assertPermission } from '../../domain/maintenance-access-rules'
import { assertValidMaintenanceAttachment } from '../../domain/maintenance-attachment-rules'
import type { MaintenanceAttachment } from '../../types/maintenance-ticket'
import type { UploadMaintenanceTicketAttachmentInput } from '../../types/use-case-inputs'
import type { MaintenanceAttachmentStoragePort } from '../ports/maintenance-attachment-storage.port'
import { loadTicket } from '../workflow'

export class UploadMaintenanceTicketAttachmentUseCase {
  constructor(
    private readonly maintenanceTicketRepository: MaintenanceTicketRepository,
    private readonly attachmentStorage: MaintenanceAttachmentStoragePort,
  ) {}

  async execute(input: UploadMaintenanceTicketAttachmentInput): Promise<MaintenanceAttachment> {
    const existing = await loadTicket(this.maintenanceTicketRepository, input, input.ticketId)
    assertPermission(input, existing, 'collaborate')
    assertValidMaintenanceAttachment(input.body.byteLength, input.contentType)

    const uploaded = await this.attachmentStorage.upload({
      tenantId: existing.tenantId,
      filename: input.filename,
      contentType: input.contentType,
      body: input.body,
    })

    return this.maintenanceTicketRepository.addAttachment(existing, {
      name: input.filename,
      url: uploaded.url,
      authorId: input.actorId,
      authorName: input.actorName,
    })
  }
}
