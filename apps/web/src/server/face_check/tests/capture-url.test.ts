// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildCaptureUrl,
  buildCaptureUrlForLocale,
  buildCandidateCaptureUrl,
} from '../http/capture-url'

const token = 'a'.repeat(64)
const request = (language = 'pt-BR') =>
  new Request('http://internal.test/api/face_check/sessions', {
    headers: { 'Accept-Language': language },
  })

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3399')
  vi.stubEnv('DATABASE_URL', 'postgresql://test:test@127.0.0.1:55532/ketris_face_check_test_links')
  vi.stubEnv('KETRIS_E2E_ISOLATED_DB', '1')
  vi.stubEnv('CI', '')
})
afterEach(() => vi.unstubAllEnvs())

describe('FaceCheck capture links in production builds and isolated E2E', () => {
  it.each([
    ['pt-BR', 'pt'],
    ['en-US', 'en'],
    ['es-ES', 'es'],
  ] as const)(
    'builds a private dashboard capture link in %s without the invitation token',
    (locale, prefix) => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://trusted.example.test')
      expect(buildCandidateCaptureUrl(request(locale), 'owned-session')).toBe(
        `https://trusted.example.test/${prefix}/dashboard/face_check/my-verifications/owned-session`,
      )
    },
  )
  it('builds a persisted-locale worker link solely from the trusted configured origin', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://trusted.example.test')
    expect(buildCaptureUrlForLocale('es-ES', token)).toBe(
      `https://trusted.example.test/es/face_check/verify/${token}`,
    )
  })

  it('permits a local HTTP app only with the explicit isolated E2E flag and local disposable database', () => {
    expect(buildCaptureUrl(request('en-US'), token)).toBe(
      `http://localhost:3399/en/face_check/verify/${token}`,
    )
  })

  it('permits the local ketris CI database and HTTPS loopback origin', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://127.0.0.1:3399')
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:55532/ketris')
    vi.stubEnv('CI', 'true')
    expect(buildCaptureUrl(request('es-ES'), token)).toBe(
      `https://127.0.0.1:3399/es/face_check/verify/${token}`,
    )
  })

  it('supports loopback IPv6 for the app and disposable database', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://[::1]:3399')
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@[::1]:55532/ketris_face_check_test_links')
    expect(buildCaptureUrl(request(), token)).toBe(
      `http://[::1]:3399/pt/face_check/verify/${token}`,
    )
  })

  it('keeps normal public HTTPS production origins working with a remote database', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.test')
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@database.example.test/ketris')
    vi.stubEnv('KETRIS_E2E_ISOLATED_DB', '')
    expect(buildCaptureUrl(request(), token)).toBe(
      `https://app.example.test/pt/face_check/verify/${token}`,
    )
  })

  it.each([
    ['missing isolation flag', 'KETRIS_E2E_ISOLATED_DB', ''],
    [
      'remote database',
      'DATABASE_URL',
      'postgresql://test:test@database.example.test/ketris_face_check_test_links',
    ],
    ['public HTTP origin', 'NEXT_PUBLIC_APP_URL', 'http://app.example.test'],
    ['application URL credentials', 'NEXT_PUBLIC_APP_URL', 'http://user:password@localhost:3399'],
    [
      'public HTTPS URL credentials',
      'NEXT_PUBLIC_APP_URL',
      'https://user:password@app.example.test',
    ],
    ['invalid application URL', 'NEXT_PUBLIC_APP_URL', 'not a valid URL'],
    ['non-HTTP origin', 'NEXT_PUBLIC_APP_URL', 'ftp://localhost:3399'],
    ['invalid database URL', 'DATABASE_URL', 'not a valid URL'],
    ['non-PostgreSQL database', 'DATABASE_URL', 'https://localhost/ketris_face_check_test_links'],
    ['missing explicit database', 'DATABASE_URL', ''],
    [
      'unisolated local database name',
      'DATABASE_URL',
      'postgresql://test:test@localhost:55532/main',
    ],
    ['base database outside CI', 'DATABASE_URL', 'postgresql://test:test@localhost:55532/ketris'],
    [
      'query host override',
      'DATABASE_URL',
      'postgresql://test:test@localhost:55532/ketris_face_check_test_links?host=remote.example.test',
    ],
  ])('rejects %s', (_reason, name, value) => {
    vi.stubEnv(name, value)
    expect(() => buildCaptureUrl(request(), token)).toThrow(
      expect.objectContaining({ code: 'STORAGE_UNAVAILABLE', status: 503 }),
    )
  })
})
