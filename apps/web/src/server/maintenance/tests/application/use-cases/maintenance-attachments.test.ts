import { describe, expect, it, vi } from 'vitest'
import { ConflictError } from '@server/shared/errors'
import {
  MaintenanceTicketNotFoundError,
  MaintenanceAttachmentValidationError,
} from '../../../domain/errors'
import { UploadMaintenanceTicketAttachmentUseCase } from '../../../application/use-cases/upload-maintenance-ticket-attachment.use-case'
import { permissionsFor } from '../../../domain/maintenance-access-rules'
import { admin, renter, ticket, repository } from '../../fixtures/maintenance-ticket'

describe('Maintenance attachments', () => {
  it('blocks attachment uploads before storage access when unauthorized or terminal', async () => {
    const storage = {
      upload: vi.fn().mockResolvedValue({ url: 'file', contentType: 'image/png' }),
      download: vi.fn(),
    }
    const input = {
      ...renter,
      ticketId: ticket.id,
      filename: 'photo.png',
      contentType: 'image/png',
      body: Buffer.from('photo'),
    }
    await expect(
      new UploadMaintenanceTicketAttachmentUseCase(
        repository({ status: 'RESOLVIDO' }),
        storage,
      ).execute(input),
    ).rejects.toBeInstanceOf(ConflictError)
    await expect(
      new UploadMaintenanceTicketAttachmentUseCase(repository(), storage).execute({
        ...input,
        actorId: 'other',
      }),
    ).rejects.toBeInstanceOf(MaintenanceTicketNotFoundError)
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it.each([
    { body: Buffer.alloc(0), contentType: 'image/png' },
    { body: Buffer.alloc(8 * 1024 * 1024 + 1), contentType: 'image/png' },
    { body: Buffer.from('text'), contentType: 'text/plain' },
  ])('keeps attachment format and size validation', async (invalid) => {
    const storage = { upload: vi.fn(), download: vi.fn() }
    const useCase = new UploadMaintenanceTicketAttachmentUseCase(repository(), storage)
    await expect(
      useCase.execute({ ...renter, ticketId: ticket.id, filename: 'photo.png', ...invalid }),
    ).rejects.toBeInstanceOf(MaintenanceAttachmentValidationError)
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('allows linked renter to attach even on calls opened by admin', async () => {
    const repo = repository({ openedById: 'admin' })
    const storage = {
      upload: vi.fn().mockResolvedValue({ url: 'file', contentType: 'image/png' }),
      download: vi.fn(),
    }
    await new UploadMaintenanceTicketAttachmentUseCase(repo, storage).execute({
      ...renter,
      ticketId: ticket.id,
      filename: 'photo.png',
      contentType: 'image/png',
      body: Buffer.from('photo'),
    })
    expect(repo.addAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ id: ticket.id }),
      expect.objectContaining({ authorId: 'renter', url: 'file' }),
    )
  })

  it('denies collaboration on archived calls, including admin', () => {
    expect(permissionsFor(admin, { ...ticket, deletedAt: new Date() }).collaborate).toBe(false)
  })
})
