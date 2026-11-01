import { afterEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '@shared/lib/api/http-client'

import { consoleService } from '../services/console-service'

vi.mock('@shared/lib/api/http-client', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

describe('face_check authenticated evidence', () => {
  afterEach(() => vi.clearAllMocks())

  it('downloads evidence through the shared authenticated client as a cancellable blob', async () => {
    const blob = new Blob(['private image'], { type: 'image/jpeg' })
    vi.mocked(httpClient.get).mockResolvedValue(blob)
    const controller = new AbortController()
    await expect(consoleService.getEvidence('session', 'photo', controller.signal)).resolves.toBe(
      blob,
    )
    expect(httpClient.get).toHaveBeenCalledWith('/face_check/sessions/session/evidence/photo', {
      responseType: 'blob',
      signal: controller.signal,
    })
  })

  it('decodes a Ketris JSON error returned by a binary endpoint', async () => {
    const data = new Blob([], { type: 'application/json' })
    Object.defineProperty(data, 'text', {
      value: async () =>
        JSON.stringify({
          error: { code: 'EVIDENCE_NOT_REVEALED', message: 'Reveal images first' },
        }),
    })
    vi.mocked(httpClient.get).mockRejectedValue({
      response: {
        status: 403,
        data,
      },
    })
    await expect(consoleService.getEvidence('session', 'photo')).rejects.toMatchObject({
      code: 'EVIDENCE_NOT_REVEALED',
      status: 403,
      message: 'Reveal images first',
    })
  })

  it('keeps list cancellation scoped to the originating query', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ items: [], total: 0, counts: {} })
    const controller = new AbortController()
    await consoleService.listSessions(
      { filter: 'review', search: '', page: 0, pageSize: 10 },
      controller.signal,
    )
    expect(httpClient.get).toHaveBeenCalledWith(
      '/face_check/sessions',
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})
