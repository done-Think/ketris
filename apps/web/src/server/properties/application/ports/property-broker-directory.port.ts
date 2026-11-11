import type { PropertyBrokersPage } from '../../types/property'

export interface PropertyBrokerDirectory {
  countActiveBrokers(tenantId: string, ids: string[]): Promise<number>
  listActiveBrokers(tenantId: string, page: number, pageSize: number): Promise<PropertyBrokersPage>
}
