import { describe, expect, it, vi } from 'vitest'

import { GetMarketplaceStatsUseCase } from '../../../application/use-cases/get-marketplace-stats.use-case'

describe('GetMarketplaceStatsUseCase', () => {
  it('returns the numbers read from the published catalog', async () => {
    const stats = { publishedProperties: 12, publishedBrokers: 3, servedCities: 2 }
    const reader = { read: vi.fn().mockResolvedValue(stats) }

    await expect(new GetMarketplaceStatsUseCase(reader).execute()).resolves.toEqual(stats)
    expect(reader.read).toHaveBeenCalledTimes(1)
  })
})
