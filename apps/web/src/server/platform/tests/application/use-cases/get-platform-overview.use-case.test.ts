import { describe, expect, it, vi } from 'vitest'

import type { PlatformOverviewRepository } from '../../../application/ports/platform-overview-repository.port'
import type { PlatformOverviewCounts } from '../../../types/platform-overview-repository'
import type { PlatformPlanRepository } from '../../../application/ports/platform-plan-repository.port'
import type { PlatformTenantRepository } from '../../../application/ports/platform-tenant-repository.port'
import { GetPlatformOverviewUseCase } from '../../../application/use-cases/get-platform-overview.use-case'

const now = new Date(2026, 9, 15, 12, 0)
const counts: PlatformOverviewCounts = {
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

function createRepositories() {
  const createdAt = new Date(2026, 0, 10)
  const overviewRepository: PlatformOverviewRepository = {
    getOverview: vi.fn().mockResolvedValue(counts),
  }
  const tenantRepository: PlatformTenantRepository = {
    findMany: vi.fn().mockResolvedValue([
      {
        id: 'a',
        name: 'A',
        slug: 'a',
        accountType: 'AGENCY',
        status: 'ACTIVE',
        canceledAt: null,
        createdAt,
      },
      {
        id: 'b',
        name: 'B',
        slug: 'b',
        accountType: 'BROKER',
        status: 'TRIAL',
        canceledAt: null,
        createdAt,
      },
      {
        id: 'c',
        name: 'C',
        slug: 'c',
        accountType: 'BROKER',
        status: 'CANCELED',
        canceledAt: new Date('2026-10-03T13:00:00.000Z'),
        createdAt,
      },
    ]),
    findById: vi.fn(),
    updateAccount: vi.fn(),
    findPage: vi.fn(),
    countByStatus: vi.fn(),
    findStatusChanges: vi.fn().mockResolvedValue([
      {
        tenantId: 'c',
        fromStatus: 'ACTIVE',
        toStatus: 'CANCELED',
        changedAt: new Date('2026-10-03T13:00:00.000Z'),
      },
    ]),
    countUsage: vi.fn().mockResolvedValue(new Map()),
  }
  const planRepository: PlatformPlanRepository = {
    findAll: vi.fn().mockResolvedValue([
      {
        accountType: 'BROKER',
        monthlyPrice: 99.99,
        includedUnits: 10,
        extraUnitPrice: 9.99,
        updatedAt: createdAt,
      },
      {
        accountType: 'AGENCY',
        monthlyPrice: 199.99,
        includedUnits: 10,
        extraUnitPrice: 19.99,
        updatedAt: createdAt,
      },
    ]),
    update: vi.fn(),
  }

  return { overviewRepository, tenantRepository, planRepository }
}

describe('GetPlatformOverviewUseCase', () => {
  it('junta as contagens do repositório com o MRR e o churn calculados pelo histórico', async () => {
    const { overviewRepository, tenantRepository, planRepository } = createRepositories()
    const useCase = new GetPlatformOverviewUseCase(
      overviewRepository,
      tenantRepository,
      planRepository,
      () => now,
    )

    const result = await useCase.execute()

    expect(result).toEqual({
      ...counts,
      // Base on October 1st: A and C (B is in trial, not paying); C canceled in October.
      metrics: { ...counts.metrics, mrr: 199.99, churnRate: 1 / 2 },
    })
    expect(overviewRepository.getOverview).toHaveBeenCalledWith(now)
  })
})
