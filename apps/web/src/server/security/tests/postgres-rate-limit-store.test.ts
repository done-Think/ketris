// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@server/db/prisma'
import { PostgresRateLimitStore } from '../postgres-rate-limit-store'
import { createRateLimitPolicy } from '../rate-limit'

vi.mock('@server/db/prisma', () => ({ prisma: { $queryRaw: vi.fn(), $executeRaw: vi.fn() } }))

describe('counter housekeeping', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'))
    vi.mocked(prisma.$executeRaw).mockReset().mockResolvedValue(0)
    vi.mocked(prisma.$queryRaw)
      .mockReset()
      .mockResolvedValue([
        { count: 1, resetAt: new Date(Date.now() + 60_000), observedAt: new Date() },
      ])
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps deletion out of quota consumption', async () => {
    const store = new PostgresRateLimitStore()
    await expect(
      store.consume({ key: 'client', policy: createRateLimitPolicy('api', 10, 60_000) }),
    ).resolves.toMatchObject({ allowed: true, remaining: 9 })
    expect(prisma.$executeRaw).not.toHaveBeenCalled()
  })

  it('drains multiple batches and suppresses overlapping maintenance in the same instance', async () => {
    vi.mocked(prisma.$executeRaw)
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(25)
    const store = new PostgresRateLimitStore()
    const results = await Promise.all([store.cleanupExpired(), store.cleanupExpired()])
    expect(results).toEqual([225, 0])
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(3)
    expect(await store.cleanupExpired()).toBe(0)
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(3)
  })

  it('bounds each cycle and retries backlog sooner than an idle cycle', async () => {
    vi.mocked(prisma.$executeRaw).mockResolvedValue(100)
    const store = new PostgresRateLimitStore()
    expect(await store.cleanupExpired()).toBe(1000)
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(10)
    vi.advanceTimersByTime(1000)
    vi.mocked(prisma.$executeRaw).mockResolvedValue(0)
    await store.cleanupExpired()
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(11)
  })

  it('stops at the time budget between batches', async () => {
    vi.mocked(prisma.$executeRaw).mockResolvedValue(100)
    const cleanup = new PostgresRateLimitStore().cleanupExpired()
    vi.advanceTimersByTime(1_000)
    expect(await cleanup).toBe(100)
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1)
  })

  it('contains housekeeping failures while quota failures still propagate', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(prisma.$executeRaw).mockRejectedValue(new Error('cleanup unavailable'))
    const store = new PostgresRateLimitStore()
    await expect(store.cleanupExpired()).resolves.toBe(0)
    await expect(
      store.consume({ key: 'client', policy: createRateLimitPolicy('api', 10, 60_000) }),
    ).resolves.toMatchObject({ allowed: true })
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('quota unavailable'))
    await expect(
      store.consume({ key: 'client', policy: createRateLimitPolicy('api', 10, 60_000) }),
    ).rejects.toThrow('quota unavailable')
  })
})
