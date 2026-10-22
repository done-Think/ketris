import type { UploadMaintenanceTicketAttachmentInput } from '../../types/use-case-inputs'
import { MaintenanceAttachmentValidationError } from '../../domain/errors'
import type { MaintenanceAttachment } from '../../types/maintenance-ticket'
import { loadTicket } from '../workflow'
import { assertPermission } from '../authorization'
import type { MaintenanceAttachmentStoragePort } from '../../types/maintenance-attachment-storage'
import type { MaintenanceTicketRepository } from '../../types/maintenance-ticket-repository'

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
      tenantId: input.actorTenantId,
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
