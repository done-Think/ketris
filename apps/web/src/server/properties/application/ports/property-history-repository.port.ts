import type { PropertyHistoryEvent, PropertyHistoryPage } from '../../types/property-history'

export interface PropertyHistoryRepository {
  list(
    tenantId: string,
    propertyId: string,
    page: number,
    pageSize: number,
  ): Promise<PropertyHistoryPage>
  find(tenantId: string, propertyId: string, eventId: string): Promise<PropertyHistoryEvent | null>
}
