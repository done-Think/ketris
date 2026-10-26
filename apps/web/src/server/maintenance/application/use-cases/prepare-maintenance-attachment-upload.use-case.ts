import { validateMaintenanceAttachmentMetadata } from '../../domain/maintenance-attachment'
import { assertPermission } from '../../domain/maintenance-policy'
import type { PrepareMaintenanceUploadInput } from '../../types/maintenance-upload'
import { maintenanceAttachmentKey } from '../maintenance-attachment-key'
import { loadTicket } from '../maintenance-ticket-context'
import type {
  MaintenanceDirectUploadStorage,
  MaintenanceUploadIds,
  MaintenanceUploadTickets,
} from '../ports/maintenance-direct-upload.port'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class PrepareMaintenanceAttachmentUploadUseCase {
  constructor(
    private readonly repository: MaintenanceTicketRepository,
    private readonly storage: MaintenanceDirectUploadStorage,
    private readonly tickets: MaintenanceUploadTickets,
    private readonly ids: MaintenanceUploadIds,
  ) {}
  async execute(input: PrepareMaintenanceUploadInput) {
    const ticket = await loadTicket(this.repository, input, input.ticketId)
    assertPermission(input, ticket, 'collaborate')
    const metadata = validateMaintenanceAttachmentMetadata({
      filename: input.filename,
      contentType: input.contentType,
      size: input.size,
      sha256: input.sha256,
    })
    const descriptor = {
      ...metadata,
      uploadId: this.ids.generate(),
      actorId: input.actorId,
      tenantId: ticket.tenantId,
      ticketId: ticket.id,
    }
    const token = await this.tickets.issue(descriptor)
    const upload = await this.storage.uploadLocation(
      maintenanceAttachmentKey(descriptor),
      descriptor,
    )
    return { upload, token }
  }
}
