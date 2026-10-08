import { describe, expect, it, vi } from 'vitest'

import type { AgencyActivity, AgencyTopBroker } from '../../../domain/agency-overview.entity'
import type { AgencyOverviewRepository } from '../../../application/ports/agency-overview-repository.port'
import type { FinancialSummaryProvider } from '../../../application/ports/financial-summary-provider.port'
import { GetAgencyOverviewUseCase } from '../../../application/use-cases/get-agency-overview.use-case'

const topBroker: AgencyTopBroker = {
  id: 'broker-1',
  name: 'Marina Souza',
  avatarUrl: null,
  salesCount: 2,
  revenueTotal: 5000,
  recentSales: [
    {
      id: 'contract-1',
      propertyId: 'property-1',
      propertyTitle: 'Apartamento Batel',
      location: 'Batel, Curitiba',
      value: 2500,
      closedAt: new Date('2026-09-20T00:00:00.000Z'),
    },
  ],
}

const activity: AgencyActivity = {
  id: 'contract-1',
  type: 'CONTRACT',
  brokerName: 'Marina Souza',
  detail: 'Apartamento Batel',
  occurredAt: new Date('2026-09-20T00:00:00.000Z'),
}

function createRepository(overrides?: Partial<AgencyOverviewRepository>): AgencyOverviewRepository {
  return {
    getPortfolioCount: vi.fn().mockResolvedValue(10),
    getActiveBrokersCount: vi.fn().mockResolvedValue(3),
    getReceivedLeadsThisMonth: vi.fn().mockResolvedValue(4),
    getOccupancyPercentage: vi.fn().mockResolvedValue(75),
    getTopBrokers: vi.fn().mockResolvedValue([topBroker]),
    getRecentActivities: vi.fn().mockResolvedValue([activity]),
    ...overrides,
  }
}

function createFinancialSummaryProvider(
  overrides?: Partial<FinancialSummaryProvider>,
): FinancialSummaryProvider {
  return {
    execute: vi.fn().mockResolvedValue({
      monthlyReceivable: 8500,
      overdueTotal: 0,
      defaultRatePercentage: 0,
      monthlySeries: [{ year: 2026, month: 9, total: 8500 }],
      upcomingDues: [],
    }),
    ...overrides,
  }
}

describe('GetAgencyOverviewUseCase', () => {
  it('lança ForbiddenError quando o ator é AGENT', async () => {
    const useCase = new GetAgencyOverviewUseCase(
      createRepository(),
      createFinancialSummaryProvider(),
    )

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'AGENT' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('lança ForbiddenError quando o ator é RENTER', async () => {
    const useCase = new GetAgencyOverviewUseCase(
      createRepository(),
      createFinancialSummaryProvider(),
    )

    await expect(
      useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'RENTER' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('monta a visão geral combinando repositório e financial summary para OWNER', async () => {
    const repository = createRepository()
    const financialSummaryProvider = createFinancialSummaryProvider()
    const useCase = new GetAgencyOverviewUseCase(repository, financialSummaryProvider)

    const result = await useCase.execute({ actorTenantId: 'tenant-1', actorPapel: 'OWNER' })

    expect(result).toEqual({
      kpis: {
        portfolioCount: 10,
        activeBrokersCount: 3,
        receivedLeadsThisMonth: 4,
        monthlyReceivable: 8500,
        occupancyPercentage: 75,
      },
      revenueSeries: [{ year: 2026, month: 9, total: 8500 }],
      topBrokers: [topBroker],
      recentActivities: [activity],
    })
    expect(financialSummaryProvider.execute).toHaveBeenCalledWith({ actorTenantId: 'tenant-1' })
  })

  it('permite ADMIN e delega o mesmo tenant do ator para todas as fontes', async () => {
    const repository = createRepository()
    const useCase = new GetAgencyOverviewUseCase(repository, createFinancialSummaryProvider())

    await useCase.execute({ actorTenantId: 'tenant-2', actorPapel: 'ADMIN' })

    expect(repository.getPortfolioCount).toHaveBeenCalledWith('tenant-2')
    expect(repository.getActiveBrokersCount).toHaveBeenCalledWith('tenant-2')
    expect(repository.getReceivedLeadsThisMonth).toHaveBeenCalledWith('tenant-2', expect.any(Date))
    expect(repository.getOccupancyPercentage).toHaveBeenCalledWith('tenant-2')
    expect(repository.getTopBrokers).toHaveBeenCalledWith('tenant-2')
    expect(repository.getRecentActivities).toHaveBeenCalledWith('tenant-2')
  })
})
