export interface TeamMembershipRequestRepository {
  isPending(tenantId: string, userId: string): Promise<boolean>
  hasPortfolio(tenantId: string, userId: string): Promise<boolean>
  deletePending(tenantId: string, userId: string): Promise<boolean>
}
