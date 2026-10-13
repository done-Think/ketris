import type { Papel } from '@server/auth/domain/user.entity'
import { ForbiddenError } from '@server/shared/errors'

import type { AgencyOverview } from '../../domain/agency-overview.entity'
import type { AgencyOverviewRepository } from '../ports/agency-overview-repository.port'
import type { FinancialSummaryProvider } from '../ports/financial-summary-provider.port'

export interface GetAgencyOverviewInput {
  actorTenantId: string
  actorPapel: Papel
}

export class GetAgencyOverviewUseCase {
  constructor(
    private readonly repository: AgencyOverviewRepository,
    private readonly financialSummaryProvider: FinancialSummaryProvider,
  ) {}

  async execute(input: GetAgencyOverviewInput): Promise<AgencyOverview> {
    if (input.actorPapel !== 'OWNER' && input.actorPapel !== 'ADMIN') {
      throw new ForbiddenError(
        'Apenas proprietários ou administradores podem ver a visão geral da agência.',
      )
    }

    const referenceDate = new Date()

    const [
      portfolioCount,
      activeBrokersCount,
      receivedLeadsThisMonth,
      occupancyPercentage,
      financialSummary,
      topBrokers,
      recentActivities,
    ] = await Promise.all([
      this.repository.getPortfolioCount(input.actorTenantId),
      this.repository.getActiveBrokersCount(input.actorTenantId),
      this.repository.getReceivedLeadsThisMonth(input.actorTenantId, referenceDate),
      this.repository.getOccupancyPercentage(input.actorTenantId),
      this.financialSummaryProvider.execute({ actorTenantId: input.actorTenantId }),
      this.repository.getTopBrokers(input.actorTenantId),
      this.repository.getRecentActivities(input.actorTenantId),
    ])

    return {
      kpis: {
        portfolioCount,
        activeBrokersCount,
        receivedLeadsThisMonth,
        monthlyReceivable: financialSummary.monthlyReceivable,
        occupancyPercentage,
      },
      revenueSeries: financialSummary.monthlySeries,
      topBrokers,
      recentActivities,
    }
  }
}
