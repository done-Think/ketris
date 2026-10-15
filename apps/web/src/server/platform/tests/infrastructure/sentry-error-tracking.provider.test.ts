import { describe, expect, it, vi } from 'vitest'

import { SentryErrorTrackingProvider } from '../../infrastructure/sentry-error-tracking.provider'

const config = {
  apiUrl: 'https://sentry.io',
  organization: 'donethink-ct',
  project: 'ketris',
  token: 'read-token',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

describe('SentryErrorTrackingProvider', () => {
  it.each([
    { ...config, token: undefined },
    { ...config, organization: undefined },
    { ...config, project: '' },
  ])('informa que não está configurado sem org, projeto ou token', async (partialConfig) => {
    const fetcher = vi.fn()
    const provider = new SentryErrorTrackingProvider(partialConfig, fetcher)

    await expect(provider.getRecentIssues()).resolves.toEqual({ configured: false })
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('busca os erros não resolvidos das últimas 24h com o token de leitura', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          id: '42',
          title: 'TypeError: x is undefined',
          level: 'error',
          count: '17',
          lastSeen: '2026-10-15T11:58:00.000Z',
          permalink: 'https://sentry.io/organizations/donethink-ct/issues/42/',
        },
        { id: 'sem-campos' },
      ]),
    )
    const provider = new SentryErrorTrackingProvider(config, fetcher)

    const result = await provider.getRecentIssues()

    const [url, init] = fetcher.mock.calls[0]
    expect(String(url)).toBe(
      'https://sentry.io/api/0/projects/donethink-ct/ketris/issues/?query=is%3Aunresolved&statsPeriod=24h&limit=10',
    )
    expect(init.headers).toEqual({ Authorization: 'Bearer read-token' })
    expect(result).toEqual({
      configured: true,
      available: true,
      issues: [
        {
          id: '42',
          title: 'TypeError: x is undefined',
          level: 'error',
          eventsCount: 17,
          lastSeen: new Date('2026-10-15T11:58:00.000Z'),
          permalink: 'https://sentry.io/organizations/donethink-ct/issues/42/',
        },
      ],
    })
  })

  it('informa indisponível quando o Sentry recusa, responde algo inesperado ou falha', async () => {
    for (const fetcher of [
      vi.fn().mockResolvedValue(jsonResponse({ detail: 'Invalid token' }, 401)),
      vi.fn().mockResolvedValue(jsonResponse({ unexpected: true })),
      vi.fn().mockRejectedValue(new Error('network down')),
    ]) {
      const provider = new SentryErrorTrackingProvider(config, fetcher)

      await expect(provider.getRecentIssues()).resolves.toEqual({
        configured: true,
        available: false,
      })
    }
  })
})
