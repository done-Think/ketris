import * as Sentry from '@sentry/nextjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { reportLogoutRevocationFailure } from '@shared/lib/telemetry/session-telemetry'

vi.mock('@sentry/nextjs', () => ({
  withScope: vi.fn((callback: (scope: unknown) => void) => callback(scope)),
  captureMessage: vi.fn(),
}))

const processors: Array<(event: Record<string, unknown>) => Record<string, unknown>> = []
const scope = {
  addEventProcessor: (processor: (typeof processors)[number]) => processors.push(processor),
}

describe('reportLogoutRevocationFailure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    processors.length = 0
  })

  it('captures only the failure kind and status, never tokens, URLs or headers', () => {
    reportLogoutRevocationFailure({
      isAxiosError: true,
      code: 'ERR_BAD_RESPONSE',
      message: 'Request failed with status code 503',
      config: {
        data: '{"refreshToken":"secret-refresh"}',
        headers: { Authorization: 'Bearer secret' },
      },
      response: { status: 503 },
    })

    expect(Sentry.captureMessage).toHaveBeenCalledWith('auth.logout_revocation_failed', 'warning')
    const event = processors[0]({
      request: { url: 'https://app/#token=secret' },
      extra: { token: 'secret-refresh' },
      breadcrumbs: [{ data: 'secret' }],
      event_id: 'evt',
    })
    expect(event).toMatchObject({
      message: 'auth.logout_revocation_failed',
      tags: { module: 'auth', status: '503', code: 'ERR_BAD_RESPONSE' },
    })
    expect(JSON.stringify(event)).not.toContain('secret')
  })

  it('tolerates non-HTTP failures', () => {
    reportLogoutRevocationFailure(new TypeError('Failed to fetch'))
    const event = processors[0]({})
    expect(event).toMatchObject({ tags: { module: 'auth', status: 'none', code: 'TypeError' } })
  })
})
