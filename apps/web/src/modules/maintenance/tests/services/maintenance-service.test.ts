import { HttpClient } from '@shared/lib/api/http-client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MaintenanceService } from '../../services/maintenance-service'
import { MaintenanceUploadValidationError } from '../../utils/maintenance-file'

vi.mock('../../utils/maintenance-file', async (original) => ({
  ...(await original<typeof import('../../utils/maintenance-file')>()),
  maintenanceFileSha256: vi.fn().mockResolvedValue('ab'.repeat(32)),
}))

describe('MaintenanceService direct upload', () => {
  afterEach(() => vi.unstubAllGlobals())
  function setup(ok = true) {
    const http = new HttpClient()
    const post = vi
      .spyOn(http, 'post')
      .mockResolvedValueOnce({
        upload: {
          url: 'https://private.example.test/object',
          headers: { 'Content-Type': 'image/png', 'x-amz-checksum-sha256': 'checksum' },
        },
        token: 'signed-grant',
      })
      .mockResolvedValueOnce({ attachment: { id: 'attachment-1' } })
    const put = vi.fn().mockResolvedValue({ ok })
    vi.stubGlobal('fetch', put)
    return { service: new MaintenanceService(http), post, put }
  }
  it('sends the file straight to storage without application credentials and confirms afterward', async () => {
    const { service, post, put } = setup()
    const file = new File(['image'], 'repair.png', { type: 'image/png' })
    expect(await service.uploadAttachment('ticket-1', file)).toEqual({ id: 'attachment-1' })
    expect(post.mock.calls[0]).toEqual([
      '/maintenance/tickets/ticket-1/attachments/upload',
      { filename: file.name, size: file.size, contentType: file.type, sha256: 'ab'.repeat(32) },
    ])
    expect(put).toHaveBeenCalledWith('https://private.example.test/object', {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png', 'x-amz-checksum-sha256': 'checksum' },
      credentials: 'omit',
      body: file,
    })
    expect(post.mock.calls[1]).toEqual([
      '/maintenance/tickets/ticket-1/attachments/complete',
      { token: 'signed-grant' },
    ])
    expect(post.mock.invocationCallOrder[1]).toBeGreaterThan(put.mock.invocationCallOrder[0])
  })
  it('never confirms a failed storage upload', async () => {
    const { service, post } = setup(false)
    await expect(
      service.uploadAttachment(
        'ticket-1',
        new File(['image'], 'repair.png', { type: 'image/png' }),
      ),
    ).rejects.toThrow()
    expect(post).toHaveBeenCalledTimes(1)
  })
  it.each([
    new File([], 'empty.png', { type: 'image/png' }),
    new File(['text'], 'text.txt', { type: 'text/plain' }),
    new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
  ])('rejects an invalid file before authorization', async (file) => {
    const { service, post, put } = setup()
    await expect(service.uploadAttachment('ticket-1', file)).rejects.toBeInstanceOf(
      MaintenanceUploadValidationError,
    )
    expect(post).not.toHaveBeenCalled()
    expect(put).not.toHaveBeenCalled()
  })
})
