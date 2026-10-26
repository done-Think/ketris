import { describe, expect, it, vi } from 'vitest'
import { MaintenanceTicketNotFoundError } from '../../../domain/errors'
import { GetMaintenanceAttachmentUseCase } from '../../../application/use-cases/get-maintenance-attachment.use-case'
import { admin, renter, repository } from '../../fixtures/maintenance-ticket'

function storage(found = true) {
  return {
    upload: vi.fn(),
    download: vi
      .fn()
      .mockResolvedValue(found ? { body: new Uint8Array([1]), contentType: 'image/png' } : null),
  }
}

describe('Maintenance private media', () => {
  it('downloads the object of an attachment the actor can see', async () => {
    const repo = repository()
    const files = storage()
    const result = await new GetMaintenanceAttachmentUseCase(repo, files).execute({
      ...renter,
      keyParts: ['maintenance', 'tenant-1', 'a.png'],
    })
    expect(result).toEqual({ body: new Uint8Array([1]), contentType: 'image/png' })
    expect(repo.findAttachmentTicket).toHaveBeenCalledWith(
      renter,
      '/api/maintenance/media/maintenance/tenant-1/a.png',
    )
    expect(files.download).toHaveBeenCalledWith('maintenance/tenant-1/a.png')
  })

  it('returns null when the stored object is gone', async () => {
    await expect(
      new GetMaintenanceAttachmentUseCase(repository(), storage(false)).execute({
        ...admin,
        keyParts: ['maintenance', 'tenant-1', 'a.png'],
      }),
    ).resolves.toBeNull()
  })

  it('refuses keys whose tenant differs from the ticket and never reaches storage', async () => {
    const files = storage()
    await expect(
      new GetMaintenanceAttachmentUseCase(repository(), files).execute({
        ...renter,
        keyParts: ['maintenance', 'other-tenant', 'a.png'],
      }),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    await expect(
      new GetMaintenanceAttachmentUseCase(repository(), files).execute({
        ...renter,
        actorId: 'stranger',
        keyParts: ['maintenance', 'tenant-1', 'a.png'],
      }),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    expect(files.download).not.toHaveBeenCalled()
  })
})
