import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/cron/instagram/route'
import { configureInstagramTestEnv } from '../fixtures/environment'

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  refresh: vi.fn(),
  expiringConnections: vi.fn(),
  cleanupStates: vi.fn(),
}))
vi.mock('@server/instagram/container', () => ({
  instagramContainer: {
    process: { execute: mocks.execute, refresh: mocks.refresh },
    repository: {
      expiringConnections: mocks.expiringConnections,
      cleanupStates: mocks.cleanupStates,
    },
  },
}))

function cronRequest(secret = 'cron-secret') {
  return new NextRequest('https://ketris.example/api/cron/instagram', {
    headers: { authorization: `Bearer ${secret}` },
  })
}

beforeEach(() => {
  configureInstagramTestEnv()
  vi.stubEnv('CRON_SECRET', 'cron-secret')
  mocks.execute.mockReset()
  mocks.refresh.mockReset().mockResolvedValue('token')
  mocks.expiringConnections.mockReset().mockResolvedValue([])
  mocks.cleanupStates.mockReset().mockResolvedValue(undefined)
})
afterEach(() => vi.unstubAllEnvs())

describe('Daily Instagram scheduler', () => {
  it('rejects a call without the scheduler secret', async () => {
    const response = await GET(cronRequest('wrong'))
    expect(response.status).toBe(401)
    expect(mocks.execute).not.toHaveBeenCalled()
  })

  it('processes every due job in one run before renewing tokens', async () => {
    mocks.execute
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
    mocks.expiringConnections.mockResolvedValue([{ accountId: '123' }])
    const response = await GET(cronRequest())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ processed: 3, skipped: false })
    expect(mocks.execute).toHaveBeenCalledTimes(4)
    expect(mocks.refresh).toHaveBeenCalledWith({ accountId: '123' })
    expect(mocks.cleanupStates).toHaveBeenCalledOnce()
  })

  it('succeeds without work while the integration is disabled', async () => {
    vi.stubEnv('INSTAGRAM_ENABLED', 'false')
    const response = await GET(cronRequest())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ processed: 0, skipped: true })
    expect(mocks.execute).not.toHaveBeenCalled()
  })
})
