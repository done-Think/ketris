import axios, { type AxiosAdapter } from 'axios'
import { HttpClient } from '@shared/lib/api/http-client'
import { API_CONTRACT_HEADER } from '@shared/config/api-contract'
import { maintenanceFileSha256 } from '../../utils/maintenance-file'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MaintenanceService } from '../../services/maintenance-service'
import { MaintenanceUploadValidationError } from '../../utils/maintenance-file'

vi.mock('../../utils/maintenance-file', async (original) => ({
  ...(await original<typeof import('../../utils/maintenance-file')>()),
  maintenanceFileSha256: vi.fn().mockResolvedValue('ab'.repeat(32)),
}))

describe('MaintenanceService signed upload', () => {
  beforeEach(() => vi.mocked(maintenanceFileSha256).mockResolvedValue('ab'.repeat(32)))
  const originalAdapter = axios.defaults.adapter
  afterEach(() => {
    axios.defaults.adapter = originalAdapter
    vi.restoreAllMocks()
  })
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
    const storage = new HttpClient('')
    const put = vi.spyOn(storage, 'put')
    if (ok) put.mockResolvedValue(undefined)
    else put.mockRejectedValue(new Error('Storage upload failed'))
    return { service: new MaintenanceService(http, storage), post, put }
  }
  it('passes category filtering and pagination to the server without losing custom categories', async () => {
    const http = new HttpClient()
    const get = vi.spyOn(http, 'get').mockResolvedValue({ items: [], totalCount: 0 })
    await new MaintenanceService(http).list({ category: 'OTHER', page: 2, pageSize: 5 })
    expect(get).toHaveBeenCalledWith('/maintenance/tickets', {
      params: { category: 'OTHER', page: '2', pageSize: '5' },
    })
  })
  it('sends the file straight to storage without application credentials and confirms afterward', async () => {
    const { service, post, put } = setup()
    const file = new File(['image'], 'repair.png', { type: 'image/png' })
    expect(await service.uploadAttachment('ticket-1', file)).toEqual({ id: 'attachment-1' })
    expect(post.mock.calls[0]).toEqual([
      '/maintenance/tickets/ticket-1/attachments/upload',
      { filename: file.name, size: file.size, contentType: file.type, sha256: 'ab'.repeat(32) },
    ])
    expect(put).toHaveBeenCalledWith('https://private.example.test/object', file, {
      headers: { 'Content-Type': 'image/png', 'x-amz-checksum-sha256': 'checksum' },
      withCredentials: false,
      timeout: 120000,
      skipUnauthorizedHandling: true,
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
  it('keeps API authentication and tenant headers out of the signed storage request', async () => {
    const calls: {
      url?: string
      headers: Record<string, unknown>
      data: unknown
      withCredentials?: boolean
    }[] = []
    const adapter: AxiosAdapter = async (config) => {
      calls.push({
        url: config.url,
        headers: config.headers.toJSON(),
        data: config.data,
        withCredentials: config.withCredentials,
      })
      const data = config.url?.endsWith('/upload')
        ? {
            upload: {
              url: 'https://private.example.test/object',
              headers: { 'Content-Type': 'image/png' },
            },
            token: 'signed-grant',
          }
        : config.url === 'https://private.example.test/object'
          ? ''
          : { attachment: { id: 'attachment-1' } }
      return { data, status: 200, statusText: 'OK', headers: {}, config }
    }
    axios.defaults.adapter = adapter
    const api = new HttpClient('https://api.example.test')
    api.setAuthToken('private-token')
    api.setTenant('tenant-1')
    const file = new File(['image'], 'repair.png', { type: 'image/png' })

    await expect(new MaintenanceService(api).uploadAttachment('ticket-1', file)).resolves.toEqual({
      id: 'attachment-1',
    })
    expect(calls).toHaveLength(3)
    expect(calls[0].headers.Authorization).toBe('Bearer private-token')
    expect(calls[0].headers['X-Tenant-Id']).toBe('tenant-1')
    expect(calls[1].headers).not.toHaveProperty('Authorization')
    expect(calls[1].headers).not.toHaveProperty('X-Tenant-Id')
    expect(calls[1].headers).not.toHaveProperty(API_CONTRACT_HEADER)
    expect(calls[1].headers['Content-Type']).toBe('image/png')
    expect(calls[1].data).toBe(file)
    expect(calls[1].withCredentials).toBe(false)
    expect(calls[2].headers.Authorization).toBe('Bearer private-token')
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
