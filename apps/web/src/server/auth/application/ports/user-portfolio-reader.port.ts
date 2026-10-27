export interface UserPortfolioReader {
  hasPortfolio(tenantId: string, userId: string): Promise<boolean>
}
