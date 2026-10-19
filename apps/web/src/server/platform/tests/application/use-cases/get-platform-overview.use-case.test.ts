import { describe, expect, it, vi } from 'vitest'

import type { PlatformOverview } from '../../../domain/platform-overview.entity'
import type { PlatformOverviewRepository } from '../../../application/ports/platform-overview-repository.port'
import { GetPlatformOverviewUseCase } from '../../../application/use-cases/get-platform-overview.use-case'

const overview: PlatformOverview = {
  metrics: { tenantsCount: 12, brokersCount: 48, propertiesCount: 230 },
  growthTrend: [{ year: 2026, month: 10, tenants: 2, contracts: 5 }],
  recentTenants: [
    {
      id: 'tenant-1',
      name: 'Alameda Prime',
      brokersCount: 6,
      propertiesCount: 40,
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
    },
  ],
}

describe('GetPlatformOverviewUseCase', () => {
  it('delega a agregação para o repositório', async () => {
    const repository: PlatformOverviewRepository = {
      getOverview: vi.fn().mockResolvedValue(overview),
    }
    const useCase = new GetPlatformOverviewUseCase(repository)

    const result = await useCase.execute()

    expect(result).toEqual(overview)
    expect(repository.getOverview).toHaveBeenCalledWith(expect.any(Date))
  })
})
