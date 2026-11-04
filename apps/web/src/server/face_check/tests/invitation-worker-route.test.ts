// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const processInvitations = vi.hoisted(() => vi.fn())
vi.mock('@server/face_check/invitation-emails', () => ({
  processFaceCheckInvitationEmails: processInvitations,
}))
import { GET } from '../../../app/api/internal/face_check/invitations/route'

const secret = 'test-invitation-worker-secret-at-least-32-bytes'
function request(authorization?: string) {
  return new NextRequest('https://app.test/api/internal/face_check/invitations', {
    headers: authorization ? { authorization } : {},
  })
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('FACE_CHECK_RETENTION_SECRET', secret)
  processInvitations.mockResolvedValue({ sent: 1, failed: 0, cancelled: 2 })
})
afterEach(() => vi.unstubAllEnvs())

it('does not send emails without a configured worker secret and exact Bearer', async () => {
  for (const authorization of [undefined, 'Bearer wrong', secret])
    expect((await GET(request(authorization))).status).toBe(401)
  vi.stubEnv('FACE_CHECK_RETENTION_SECRET', 'short')
  expect((await GET(request('Bearer short'))).status).toBe(503)
  expect(processInvitations).not.toHaveBeenCalled()
})
it('returns aggregate counts without caching and bounds the worker batch', async () => {
  const response = await GET(request(`Bearer ${secret}`))
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toContain('no-store')
  expect(await response.json()).toEqual({ sent: 1, failed: 0, cancelled: 2 })
  expect(processInvitations).toHaveBeenCalledWith({ limit: 25, budgetMs: 20000 })
})
it('reports partial failures and sanitizes transport exceptions', async () => {
  processInvitations.mockResolvedValueOnce({ sent: 0, failed: 1, cancelled: 0 })
  expect((await GET(request(`Bearer ${secret}`))).status).toBe(503)
  processInvitations.mockRejectedValueOnce(new Error('private recipient and credentials'))
  const response = await GET(request(`Bearer ${secret}`))
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({ error: { code: 'INVITATION_EMAIL_UNAVAILABLE' } })
})
