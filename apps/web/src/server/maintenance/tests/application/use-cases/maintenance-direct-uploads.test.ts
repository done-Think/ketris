// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CompleteMaintenanceAttachmentUploadUseCase } from '../../../application/use-cases/complete-maintenance-attachment-upload.use-case'
import { PrepareMaintenanceAttachmentUploadUseCase } from '../../../application/use-cases/prepare-maintenance-attachment-upload.use-case'
import { MAINTENANCE_ATTACHMENT_MAX_BYTES } from '../../../config/attachment-limits'
import {
  MaintenanceAttachmentValidationError,
  MaintenanceTicketNotFoundError,
} from '../../../domain/errors'
import { renter, repository } from '../../fixtures/maintenance-ticket'

const descriptor = {
  uploadId: '00000000-0000-4000-8000-000000000001',
  actorId: 'renter',
  tenantId: 'tenant-1',
  ticketId: 'ticket-1',
  filename: 'repair.png',
  contentType: 'image/png',
  size: 1024,
  sha256: 'a'.repeat(64),
}
function ports() {
  return {
    repository: repository(),
    storage: {
      uploadLocation: vi
        .fn()
        .mockResolvedValue({ url: 'https://storage.example.test/upload', headers: {} }),
      inspect: vi.fn().mockResolvedValue({
        size: descriptor.size,
        contentType: descriptor.contentType,
        sha256: descriptor.sha256,
      }),
    },
    tickets: {
      issue: vi.fn().mockResolvedValue('signed-upload'),
      verify: vi.fn().mockResolvedValue(descriptor),
    },
    ids: { generate: () => descriptor.uploadId },
  }
}
describe('Maintenance direct attachment authorization', () => {
  beforeEach(() => vi.clearAllMocks())
  it('authorizes 8 MB using the linked ticket tenant instead of a shared renter account tenant', async () => {
    const p = ports()
    const { filename, contentType, sha256 } = descriptor
    await new PrepareMaintenanceAttachmentUploadUseCase(
      p.repository,
      p.storage,
      p.tickets,
      p.ids,
    ).execute({
      ...renter,
      actorTenantId: 'shared',
      ticketId: 'ticket-1',
      filename,
      contentType,
      sha256,
      size: MAINTENANCE_ATTACHMENT_MAX_BYTES,
    })
    expect(p.tickets.issue).toHaveBeenCalledWith({
      ...descriptor,
      size: MAINTENANCE_ATTACHMENT_MAX_BYTES,
    })
    expect(p.storage.uploadLocation).toHaveBeenCalledWith(
      expect.stringMatching(/^maintenance\/tenant-1\//),
      { ...descriptor, size: MAINTENANCE_ATTACHMENT_MAX_BYTES },
    )
  })
  it.each([0, MAINTENANCE_ATTACHMENT_MAX_BYTES + 1])(
    'refuses an invalid byte count before granting storage access: %s',
    async (size) => {
      const p = ports()
      await expect(
        new PrepareMaintenanceAttachmentUploadUseCase(
          p.repository,
          p.storage,
          p.tickets,
          p.ids,
        ).execute({ ...renter, ...descriptor, size }),
      ).rejects.toBeInstanceOf(MaintenanceAttachmentValidationError)
      expect(p.tickets.issue).not.toHaveBeenCalled()
      expect(p.storage.uploadLocation).not.toHaveBeenCalled()
    },
  )
  it('refuses reading or completing an upload that belongs to another user, ticket or agency', async () => {
    for (const changed of [
      { actorId: 'another-user' },
      { ticketId: 'another-ticket' },
      { tenantId: 'another-agency' },
    ]) {
      const p = ports()
      p.tickets.verify.mockResolvedValue({ ...descriptor, ...changed })
      await expect(
        new CompleteMaintenanceAttachmentUploadUseCase(p.repository, p.storage, p.tickets).execute({
          ...renter,
          ticketId: 'ticket-1',
          token: 'signed-upload',
        }),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
      expect(p.storage.inspect).not.toHaveBeenCalled()
      expect(p.repository.addAttachment).not.toHaveBeenCalled()
    }
  })
  it('revalidates collaboration after the file was uploaded', async () => {
    const p = ports()
    const tickets = repository({ status: 'RESOLVED' })
    await expect(
      new CompleteMaintenanceAttachmentUploadUseCase(tickets, p.storage, p.tickets).execute({
        ...renter,
        ticketId: 'ticket-1',
        token: 'signed-upload',
      }),
    ).rejects.toBeDefined()
    expect(p.tickets.verify).not.toHaveBeenCalled()
    expect(p.storage.inspect).not.toHaveBeenCalled()
  })
  it.each([
    { size: 2048 },
    { contentType: 'text/html' },
    { sha256: 'b'.repeat(64) },
    { sha256: null },
  ])('refuses changed storage metadata: %j', async (changed) => {
    const p = ports()
    p.storage.inspect.mockResolvedValue({ ...descriptor, ...changed } as never)
    await expect(
      new CompleteMaintenanceAttachmentUploadUseCase(p.repository, p.storage, p.tickets).execute({
        ...renter,
        ticketId: 'ticket-1',
        token: 'signed-upload',
      }),
    ).rejects.toBeInstanceOf(MaintenanceAttachmentValidationError)
    expect(p.repository.addAttachment).not.toHaveBeenCalled()
  })
  it('records only the private API URL after storage integrity and authorization succeed', async () => {
    const p = ports()
    await new CompleteMaintenanceAttachmentUploadUseCase(
      p.repository,
      p.storage,
      p.tickets,
    ).execute({ ...renter, ticketId: 'ticket-1', token: 'signed-upload' })
    expect(p.repository.addAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ticket-1' }),
      {
        uploadId: descriptor.uploadId,
        name: 'repair.png',
        url: `/api/maintenance/media/maintenance/tenant-1/${descriptor.uploadId}-repair.png`,
        authorId: renter.actorId,
        authorName: renter.actorName,
      },
    )
  })
})
