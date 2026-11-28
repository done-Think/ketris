import { vi } from 'vitest'

export function configureInstagramTestEnv() {
  vi.stubEnv('INSTAGRAM_ENABLED', 'true')
  vi.stubEnv('INSTAGRAM_APP_ID', '123')
  vi.stubEnv('INSTAGRAM_APP_SECRET', 'test-app-secret')
  vi.stubEnv('INSTAGRAM_GRAPH_API_VERSION', 'v26.0')
  vi.stubEnv('INSTAGRAM_REDIRECT_URI', 'https://ketris.example/api/instagram/oauth/callback')
  vi.stubEnv('INSTAGRAM_PUBLIC_MEDIA_ORIGIN', 'https://ketris.example')
  vi.stubEnv('INSTAGRAM_TOKEN_ENCRYPTION_KEY', Buffer.alloc(32, 7).toString('base64'))
}
