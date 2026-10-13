import type { AgencyActivity, AgencyTopBroker } from '../../domain/agency-overview.entity'

export interface AgencyOverviewRepository {
  getPortfolioCount(tenantId: string): Promise<number>
  getNewPropertiesThisMonth(tenantId: string, referenceDate: Date): Promise<number>
  getActiveBrokersCount(tenantId: string): Promise<number>
  getReceivedLeadsThisMonth(tenantId: string, referenceDate: Date): Promise<number>
  getReceivedLeadsPreviousPeriod(tenantId: string, referenceDate: Date): Promise<number>
  getMonthlyReceivablePreviousMonth(tenantId: string, referenceDate: Date): Promise<number>
  getOccupancyPercentage(tenantId: string): Promise<number>
  getTopBrokers(tenantId: string): Promise<AgencyTopBroker[]>
  getRecentActivities(tenantId: string): Promise<AgencyActivity[]>
}
