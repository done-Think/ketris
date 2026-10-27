import { MaintenanceTicketNotFoundError } from '../../domain/errors'
import { assertTicketAccess } from '../../domain/maintenance-policy'
import type { GetMaintenanceAttachmentInput } from '../../types/use-case-inputs'
import type { MaintenanceAttachmentReaderPort } from '../ports/maintenance-attachment-storage.port'
import type { MaintenanceTicketRepository } from '../ports/maintenance-ticket-repository.port'

export class GetMaintenanceAttachmentUseCase {
  constructor(
    private readonly repository: MaintenanceTicketRepository,
    private readonly storage: MaintenanceAttachmentReaderPort,
  ) {}

  async execute(input: GetMaintenanceAttachmentInput) {
    const { key, ...actor } = input
    if (
      key[0] !== 'maintenance' ||
      (input.actorPapel !== 'RENTER' && key[1] !== input.actorTenantId) ||
      key.some((part) => part === '..' || part === '.')
    )
      throw new MaintenanceTicketNotFoundError()

    const objectKey = key.join('/')
    const ticket = await this.repository.findAttachmentTicket(
      actor,
      `/api/maintenance/media/${objectKey}`,
    )
    assertTicketAccess(actor, ticket)
    if (ticket.tenantId !== key[1]) throw new MaintenanceTicketNotFoundError()
    return this.storage.download(objectKey)
  }
}
