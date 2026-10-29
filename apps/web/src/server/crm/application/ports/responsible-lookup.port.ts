import type { OpportunityResponsible } from '../../types/opportunity-responsible'

export interface ResponsibleLookupPort {
  findActiveStaffName(tenantId: string, userId: string): Promise<string | null>
  listActiveStaff(tenantId: string): Promise<OpportunityResponsible[]>
}
