import { MaintenanceAttachmentValidationError } from '../../domain/errors'
import type { MaintenanceAttachmentStoragePort } from '../../types/maintenance-attachment-storage'
import type { MaintenanceAttachment } from '../../types/maintenance-ticket'
import type { UploadMaintenanceTicketAttachmentInput } from '../../types/use-case-inputs'
import { assertPermission } from '../authorization'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'
import { loadTicket } from '../workflow'

const allowedContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxFileSizeBytes = 8 * 1024 * 1024

export class UploadMaintenanceTicketAttachmentUseCase {
  constructor(
    private readonly maintenanceTicketRepository: MaintenanceTicketRepository,
    private readonly attachmentStorage: MaintenanceAttachmentStoragePort,
  ) {}

  async execute(input: UploadMaintenanceTicketAttachmentInput): Promise<MaintenanceAttachment> {
    const existing = await loadTicket(this.maintenanceTicketRepository, input, input.ticketId)
    assertPermission(input, existing, 'collaborate')

    if (input.body.byteLength === 0) {
      throw new MaintenanceAttachmentValidationError('Arquivo vazio.')
    }

    if (input.body.byteLength > maxFileSizeBytes) {
      throw new MaintenanceAttachmentValidationError('Imagem muito grande. O limite é 8MB.')
    }

    if (!allowedContentTypes.has(input.contentType)) {
      throw new MaintenanceAttachmentValidationError(
        'Formato de imagem não suportado. Use JPEG, PNG ou WebP.',
      )
    }

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
