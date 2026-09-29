import { financialContainer } from '@server/financial/container'

import { GetAgencyOverviewUseCase } from './application/use-cases/get-agency-overview.use-case'
import { PrismaAgencyOverviewRepository } from './infrastructure/prisma-agency-overview.repository'

const agencyOverviewRepository = new PrismaAgencyOverviewRepository()

export const agencyDashboardContainer = {
  getAgencyOverviewUseCase: new GetAgencyOverviewUseCase(
    agencyOverviewRepository,
    financialContainer.getFinancialSummaryUseCase,
  ),
}
