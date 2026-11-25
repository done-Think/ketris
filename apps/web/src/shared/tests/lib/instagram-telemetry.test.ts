import { describe, expect, it } from 'vitest'
import { sanitizeInstagramTelemetry } from '@shared/lib/telemetry/instagram-telemetry'

describe('Instagram telemetry privacy', () => {
  it('protects an Instagram context without a URL and handles circular diagnostic data', () => {
    const context: Record<string, unknown> = {
      access_token: 'private-token',
      message: 'authorization=Basic cHJpdmF0ZS1jcmVkZW50aWFs',
      errorCode: 'INSTAGRAM_PROVIDER_ERROR',
    }
    context.loop = context
    const result = sanitizeInstagramTelemetry({ contexts: { instagram: context } })
    expect(JSON.stringify(result)).not.toContain('private-token')
    expect(JSON.stringify(result)).not.toContain('cHJpdmF0ZS1jcmVkZW50aWFs')
    expect(result.contexts.instagram.errorCode).toBe('INSTAGRAM_PROVIDER_ERROR')
    expect(context.loop).toBe(context)
  })
  it('removes callback credentials while retaining diagnostic information and the original request', () => {
    const event = {
      request: {
        url: 'https://ketris.example/api/instagram/oauth/callback?code=private-code&state=private-state',
        query_string: 'code=private-code&state=private-state',
        headers: {
          Authorization: 'Bearer private-bearer',
          Cookie: 'session=private-session',
          'Content-Type': 'application/json',
        },
        data: '{"signed_request":"private-request"}',
      },
      contexts: {
        nextjs: {
          request_path: '/api/instagram/oauth/callback?code=private-code&state=private-state',
        },
      },
      extra: {
        errorCode: 'INSTAGRAM_CONFIGURATION',
        nested: {
          appSecret: 'private-app-secret',
          encryptedToken: 'private-ciphertext',
          code: 'private-code',
          state: 'private-state',
        },
      },
      exception: {
        values: [
          {
            type: 'InstagramError',
            value: 'Connection failed',
            stacktrace: {
              frames: [
                {
                  filename: '/src/server/instagram/config.ts',
                  lineno: 12,
                  vars: { config: { key: 'private-local' } },
                },
              ],
            },
          },
        ],
      },
    }
    const result = sanitizeInstagramTelemetry(event)
    const serialized = JSON.stringify(result)
    for (const secret of [
      'private-code',
      'private-state',
      'private-bearer',
      'private-session',
      'private-request',
      'private-app-secret',
      'private-ciphertext',
      'private-local',
    ])
      expect(serialized).not.toContain(secret)
    expect(result.extra.errorCode).toBe('INSTAGRAM_CONFIGURATION')
    expect(result.exception.values[0].type).toBe('InstagramError')
    expect(result.exception.values[0].stacktrace.frames[0]).toMatchObject({
      filename: '/src/server/instagram/config.ts',
      lineno: 12,
    })
    expect(result.request.url).toBe('https://ketris.example/api/instagram/oauth/callback')
    expect(result.request.headers['Content-Type']).toBe('application/json')
    expect(event.request.url).toContain('private-code')
    expect(event.request.headers.Authorization).toBe('Bearer private-bearer')
  })

  it('sanitizes spans and breadcrumbs even when the enclosing request is another page', () => {
    const event = {
      request: { url: 'https://ketris.example/pt/dashboard/profile' },
      spans: [
        {
          description:
            'GET https://graph.instagram.com/access_token?client_secret=private-secret&access_token=private-token',
          data: {
            'http.url':
              'https://graph.instagram.com/access_token?client_secret=private-secret&access_token=private-token',
            'http.request.header.authorization': 'Bearer private-header',
          },
        },
      ],
      breadcrumbs: [
        {
          category: 'fetch',
          data: {
            url: '/api/instagram/media/job/0?expires=123&signature=private-signature',
            headers: { 'Set-Cookie': 'private-cookie' },
          },
        },
      ],
    }
    const result = sanitizeInstagramTelemetry(event)
    expect(JSON.stringify(result)).not.toMatch(/private-/)
    expect(result.spans[0].description).toBe('GET https://graph.instagram.com/access_token')
    expect(result.breadcrumbs[0].data.url).toBe('/api/instagram/media/job/0')
  })

  it('removes secrets in encoded URLs, raw messages and deletion receipts', () => {
    const value = {
      request: { url: '/api/instagram/deletion-status?receipt=private-receipt' },
      message:
        'Request https://private-user:private-pass@graph.instagram.com/me?access_token=private-token failed',
      extra: {
        message: 'access_token=private-assignment&state=private-state',
        json: '{"client_secret":"private-json"}',
        header: 'Authorization: Bearer private-authorization',
        referrer:
          'https://ketris.example/api/instagram/oauth/callback?c%6Fde=private-encoded#access_token=private-fragment',
      },
    }
    expect(JSON.stringify(sanitizeInstagramTelemetry(value))).not.toMatch(/private-/)
  })

  it('keeps unrelated application telemetry unchanged', () => {
    const event = {
      request: { url: '/api/contracts?status=ACTIVE' },
      extra: { code: 'CONTRACT_NOT_FOUND', state: 'ACTIVE' },
      exception: {
        values: [
          {
            stacktrace: {
              frames: [{ filename: '/src/server/contracts/contract.ts', vars: { revision: 2 } }],
            },
          },
        ],
      },
    }
    expect(sanitizeInstagramTelemetry(event)).toBe(event)
  })

  it('recognizes Instagram frames without a request and redacts nested local variables', () => {
    const event = {
      exception: {
        values: [
          {
            type: 'Error',
            stacktrace: {
              frames: [
                {
                  filename: 'C:\\project\\src\\server\\instagram\\config.ts',
                  vars: { value: 'private-local' },
                },
              ],
            },
          },
        ],
      },
      threads: {
        values: [{ stacktrace: { frames: [{ vars: { credential: 'private-thread' } }] } }],
      },
    }
    expect(JSON.stringify(sanitizeInstagramTelemetry(event))).not.toMatch(/private-/)
  })
})
