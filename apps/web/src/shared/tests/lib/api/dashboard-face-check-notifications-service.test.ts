import { CanceledError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { httpClient } from '@shared/lib/api/http-client'
import {
  dashboardFaceCheckNotificationsService,
  isDashboardFaceCheckAccessDenied,
} from '@shared/services/dashboard-face-check-notifications-service'

vi.mock('@shared/lib/api/http-client', () => ({ httpClient: { get: vi.fn() } }))

describe('private notification counts', () => {
  afterEach(() => vi.resetAllMocks())

  it('uses the current actor token and disables cross-account refresh retries', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ count: 3, pendingCount: 2 })
    const controller = new AbortController()
    await expect(
      dashboardFaceCheckNotificationsService.count(controller.signal, 'actor-token'),
    ).resolves.toEqual({ count: 3, pendingCount: 2 })
    expect(httpClient.get).toHaveBeenCalledWith('/face_check/my-verifications/count', {
      signal: controller.signal,
      headers: { Authorization: 'Bearer actor-token' },
      skipUnauthorizedHandling: true,
    })
  })

  it('keeps denial status while discarding remote error payloads', async () => {
    vi.mocked(httpClient.get).mockRejectedValue({
      isAxiosError: true,
      message: 'private request',
      response: {
        status: 403,
        data: { personName: 'Private person', captureUrl: '/verify/private-token' },
      },
    })
    const error = await dashboardFaceCheckNotificationsService
      .count(new AbortController().signal, 'actor-token')
      .catch((value) => value)
    expect(isDashboardFaceCheckAccessDenied(error)).toBe(true)
    expect(error).toMatchObject({
      status: 403,
      message: 'Unable to load verification notifications',
    })
    expect(JSON.stringify(error)).not.toContain('Private person')
    expect(JSON.stringify(error)).not.toContain('private-token')
  })

  it('preserves cancellation so query cleanup can discard old requests', async () => {
    const cancellation = new CanceledError('cancelled')
    vi.mocked(httpClient.get).mockRejectedValue(cancellation)
    await expect(
      dashboardFaceCheckNotificationsService.count(new AbortController().signal, 'actor-token'),
    ).rejects.toBe(cancellation)
  })
})
