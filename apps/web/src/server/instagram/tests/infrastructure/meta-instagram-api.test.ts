import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MetaInstagramApi } from '../../infrastructure/meta-instagram-api'
import { configureInstagramTestEnv } from '../fixtures/environment'

beforeEach(configureInstagramTestEnv)
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Official Instagram Login adapter', () => {
  it('requests only the publishing permissions and binds the exact callback/state', () => {
    const url = new URL(new MetaInstagramApi().authorizeUrl('one-time-state'))
    expect(url.origin).toBe('https://www.instagram.com')
    expect(url.searchParams.get('scope')).toBe(
      'instagram_business_basic,instagram_business_content_publish',
    )
    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://ketris.example/api/instagram/oauth/callback',
    )
    expect(url.searchParams.get('state')).toBe('one-time-state')
  })
  it('exchanges the code on the server and preserves large Instagram identifiers', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          '{"access_token":"short-token","user_id":17841400008460057,"permissions":["instagram_business_basic","instagram_business_content_publish"]}',
        ),
      )
      .mockResolvedValueOnce(Response.json({ access_token: 'long-token', expires_in: 5184000 }))
      .mockResolvedValueOnce(
        Response.json({ user_id: '17841400008460057', username: 'monkeystecnologia' }),
      )
    vi.stubGlobal('fetch', fetchMock)
    const token = await new MetaInstagramApi().exchange('authorization-code')
    expect(token.accountId).toBe('17841400008460057')
    expect(token.oauthUserId).toBe('17841400008460057')
    expect(token.accessToken).toBe('long-token')
    expect(fetchMock.mock.calls[0][1].body.get('client_secret')).toBe('test-app-secret')
    expect(fetchMock.mock.calls[2][1].headers).toEqual({ Authorization: 'Bearer long-token' })
  })
  it('rejects missing publishing permission and never stores a partial connection', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        Response.json({
          access_token: 'short',
          user_id: '123',
          permissions: ['instagram_business_basic'],
        }),
      ),
    )
    await expect(new MetaInstagramApi().exchange('code')).rejects.toMatchObject({
      code: 'INSTAGRAM_PERMISSIONS_REQUIRED',
    })
  })
  it('accepts the data envelope and scope string in the current Meta documentation', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            data: [
              {
                access_token: 'short',
                user_id: '456',
                permissions: 'instagram_business_basic,instagram_business_content_publish',
              },
            ],
          }),
        )
        .mockResolvedValueOnce(Response.json({ access_token: 'long', expires_in: 5184000 }))
        .mockResolvedValueOnce(Response.json({ user_id: '123', username: 'monkeystecnologia' })),
    )
    await expect(new MetaInstagramApi().exchange('code')).resolves.toMatchObject({
      accountId: '123',
      oauthUserId: '456',
    })
  })
  it('maps provider failures without leaking tokens or provider response bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json(
            { error: { code: 190, message: 'sensitive-secret-token' } },
            { status: 400 },
          ),
        ),
    )
    await expect(
      new MetaInstagramApi().publish('123', 'sensitive-secret-token', 'container'),
    ).rejects.toMatchObject({
      code: 'INSTAGRAM_RECONNECT_REQUIRED',
      message: 'Não foi possível concluir a operação no Instagram.',
    })
  })
  it('honors the account quota returned by Meta instead of hardcoding a limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ data: [{ quota_usage: 50, config: { quota_total: 50 } }] }),
        ),
    )
    await expect(new MetaInstagramApi().checkLimit('123', 'token')).rejects.toMatchObject({
      code: 'INSTAGRAM_PUBLISHING_LIMIT',
    })
  })
})
