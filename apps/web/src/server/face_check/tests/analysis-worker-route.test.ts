// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const processAnalyses = vi.hoisted(() => vi.fn())
vi.mock('../analysis-jobs', () => ({ processPendingFaceCheckAnalyses: processAnalyses }))
import { GET } from '../../../app/api/internal/face_check/analysis/route'
const secret = 'analysis-worker-test-secret-at-least-32-bytes'
const request = (authorization?: string) =>
  new NextRequest('https://app.test/api/internal/face_check/analysis', {
    headers: authorization ? { authorization } : {},
  })
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('FACE_CHECK_RETENTION_SECRET', secret)
  processAnalyses.mockResolvedValue({ processed: 1, failed: 0 })
})
afterEach(() => vi.unstubAllEnvs())
it('rejects absent and incorrect maintenance credentials before processing', async () => {
  for (const auth of [undefined, 'Bearer wrong', secret])
    expect((await GET(request(auth))).status).toBe(401)
  vi.stubEnv('FACE_CHECK_RETENTION_SECRET', 'short')
  expect((await GET(request('Bearer short'))).status).toBe(503)
  expect(processAnalyses).not.toHaveBeenCalled()
})
it('returns only non-cached counts for an authorized worker', async () => {
  const response = await GET(request(`Bearer ${secret}`))
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toContain('no-store')
  expect(await response.json()).toEqual({ processed: 1, failed: 0 })
})
it('keeps partial failures visible and sanitizes exceptions', async () => {
  processAnalyses.mockResolvedValueOnce({ processed: 0, failed: 1 })
  expect((await GET(request(`Bearer ${secret}`))).status).toBe(503)
  processAnalyses.mockRejectedValueOnce(new Error('private candidate details'))
  expect(await (await GET(request(`Bearer ${secret}`))).json()).toEqual({
    error: { code: 'ANALYSIS_UNAVAILABLE' },
  })
})
