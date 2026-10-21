import { describe, expect, it, vi } from 'vitest'

import { GetSystemHealthUseCase } from '../../../application/use-cases/get-system-health.use-case'

describe('GetSystemHealthUseCase', () => {
  it('junta a medição do banco, o tempo no ar e os erros do Sentry', async () => {
    const checkedAt = new Date('2026-10-15T12:00:00.000Z')
    const useCase = new GetSystemHealthUseCase(
      { check: vi.fn().mockResolvedValue({ status: 'up', latencyMs: 12 }) },
      { getRecentIssues: vi.fn().mockResolvedValue({ configured: false }) },
      () => 3725.9,
      () => checkedAt,
    )

    await expect(useCase.execute()).resolves.toEqual({
      checkedAt,
      database: { status: 'up', latencyMs: 12 },
      serverUptimeSeconds: 3725,
      errorTracking: { configured: false },
    })
  })
})
