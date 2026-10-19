import {
  MaintenanceAttachmentValidationError,
  MaintenanceTicketNotFoundError,
} from '../../domain/errors'
import type { MaintenanceAttachment } from '../../domain/maintenance-ticket.entity'
import type { MaintenanceAttachmentStoragePort } from '../ports/maintenance-attachment-storage.port'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

const allowedContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxFileSizeBytes = 8 * 1024 * 1024

export interface UploadMaintenanceTicketAttachmentInput {
  actorTenantId: string
  actorId: string
  actorName: string
  ticketId: string
  filename: string
  contentType: string
  body: Buffer
}

export class UploadMaintenanceTicketAttachmentUseCase {
  constructor(
    private readonly maintenanceTicketRepository: MaintenanceTicketRepository,
    private readonly attachmentStorage: MaintenanceAttachmentStoragePort,
  ) {}

  async execute(input: UploadMaintenanceTicketAttachmentInput): Promise<MaintenanceAttachment> {
    const existing = await this.maintenanceTicketRepository.findById(
      input.actorTenantId,
      input.ticketId,
    )

    if (!existing) {
      throw new MaintenanceTicketNotFoundError()
    }

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

    return this.maintenanceTicketRepository.addAttachment(input.actorTenantId, input.ticketId, {
      name: input.filename,
      url: uploaded.url,
      authorId: input.actorId,
      authorName: input.actorName,
    })
  }
}
