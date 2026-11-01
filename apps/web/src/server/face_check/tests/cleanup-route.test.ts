// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const purge = vi.hoisted(() => vi.fn())
vi.mock('@server/face_check/purge', () => ({ purgeFaceCheckEvidence: purge }))
import { GET } from '../../../app/api/internal/face_check/cleanup/route'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('FACE_CHECK_RETENTION_SECRET', 'retention-test-secret-with-32-bytes')
  purge.mockResolvedValue({ deleted: 1, failed: 0 })
})
afterEach(() => vi.unstubAllEnvs())

function request(authorization?: string) {
  return new NextRequest('https://app.test/api/internal/face_check/cleanup', {
    headers: authorization ? { authorization } : {},
  })
}

it('never starts deletion without a configured secret and valid authorization', async () => {
  for (const value of [undefined, 'Bearer incorrect', 'retention-test-secret-with-32-bytes']) {
    expect((await GET(request(value))).status).toBe(401)
  }
  vi.stubEnv('FACE_CHECK_RETENTION_SECRET', 'short')
  expect((await GET(request('Bearer short'))).status).toBe(503)
  expect(purge).not.toHaveBeenCalled()
})

it('confirms deletion counts only for the authorized scheduler without caching', async () => {
  const response = await GET(request('Bearer retention-test-secret-with-32-bytes'))
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toContain('no-store')
  expect(await response.json()).toEqual({ deleted: 1, failed: 0 })
  expect(purge).toHaveBeenCalledWith({ limit: 50 })
})

it('reports partial failure and sanitizes storage exceptions for scheduler retries', async () => {
  purge.mockResolvedValueOnce({ deleted: 1, failed: 1 })
  expect((await GET(request('Bearer retention-test-secret-with-32-bytes'))).status).toBe(503)
  purge.mockRejectedValueOnce(new Error('private object key or credentials'))
  const response = await GET(request('Bearer retention-test-secret-with-32-bytes'))
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({ error: { code: 'RETENTION_UNAVAILABLE' } })
})
