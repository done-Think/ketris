import { describe, expect, it, vi } from 'vitest'
import { GetMaintenanceAttachmentUseCase } from '../../../application/use-cases/get-maintenance-attachment.use-case'
import { MaintenanceTicketNotFoundError } from '../../../domain/errors'
import { admin, renter, repository } from '../../fixtures/maintenance-ticket'

function storage(found = true) {
  return {
    download: vi
      .fn()
      .mockResolvedValue(found ? { url: 'https://private.example.test/file' } : null),
  }
}

describe('Maintenance private media', () => {
  it('authorizes the attachment before returning its temporary private URL', async () => {
    const repo = repository()
    const files = storage()
    const result = await new GetMaintenanceAttachmentUseCase(repo, files).execute({
      ...renter,
      key: ['maintenance', 'tenant-1', 'a.png'],
    })
    expect(result).toEqual({ url: 'https://private.example.test/file' })
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
        key: ['maintenance', 'tenant-1', 'a.png'],
      }),
    ).resolves.toBeNull()
  })

  it('refuses another ticket tenant and unauthorized actors before reaching storage', async () => {
    const files = storage()
    for (const input of [
      { ...renter, key: ['maintenance', 'other-tenant', 'a.png'] },
      { ...renter, actorId: 'stranger', key: ['maintenance', 'tenant-1', 'a.png'] },
    ]) {
      await expect(
        new GetMaintenanceAttachmentUseCase(repository(), files).execute(input),
      ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    }
    expect(files.download).not.toHaveBeenCalled()
  })
})
