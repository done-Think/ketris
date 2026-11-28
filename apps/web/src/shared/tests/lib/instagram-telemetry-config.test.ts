import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ init: vi.fn(), captureRequestError: vi.fn() }))
vi.mock('@sentry/nextjs', () => ({
  init: mocks.init,
  captureRequestError: mocks.captureRequestError,
  replayIntegration: () => ({}),
  captureRouterTransitionStart: vi.fn(),
  isInitialized: () => false,
  isEnabled: () => false,
  getReplay: () => undefined,
  addIntegration: vi.fn(),
  getCurrentScope: () => ({ clearBreadcrumbs: vi.fn() }),
  getIsolationScope: () => ({ clearBreadcrumbs: vi.fn() }),
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('Instagram telemetry integration', () => {
  it.each(['server', 'edge', 'client'])(
    'protects errors, transactions, spans, breadcrumbs and logs in %s',
    async (runtime) => {
      if (runtime === 'server') await import('@/sentry.server.config')
      else if (runtime === 'edge') await import('@/sentry.edge.config')
      else await import('@/instrumentation-client')
      const options = mocks.init.mock.calls[0][0]
      for (const hook of [
        'beforeSend',
        'beforeSendTransaction',
        'beforeSendSpan',
        'beforeBreadcrumb',
        'beforeSendLog',
      ]) {
        const data = {
          description: 'GET /api/instagram/oauth/callback?code=private-code&state=private-state',
        }
        expect(JSON.stringify(options[hook](data))).not.toMatch(/private-/)
      }
    },
  )

  it('passes a sanitized copy to the Next.js error reporter while retaining the original error', async () => {
    const { onRequestError } = await import('@/instrumentation')
    const error = new Error('Configuration unavailable')
    const request = {
      method: 'GET',
      path: '/api/instagram/oauth/callback?code=private-code&state=private-state',
      headers: { authorization: 'Bearer private-token' },
    }
    const context = {
      routerKind: 'App Router' as const,
      routePath: '/api/instagram/oauth/callback',
      routeType: 'route' as const,
      renderSource: undefined,
      revalidateReason: undefined,
    }
    await onRequestError(error, request, context)
    expect(mocks.captureRequestError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ path: '/api/instagram/oauth/callback', method: 'GET' }),
      context,
    )
    expect(JSON.stringify(mocks.captureRequestError.mock.calls[0][1])).not.toMatch(/private-/)
    expect(request.path).toContain('private-code')
  })
})
