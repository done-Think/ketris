import { BaseService } from '@shared/lib/api/base-service'
import type { PropertyHistoryPage, PropertyHistoryEvent } from '../types/property-history'

export class PropertyHistoryService extends BaseService {
  list(id: string, page: number, signal: AbortSignal) {
    return this.http.get<PropertyHistoryPage>(`/properties/${id}/history`, {
      signal,
      params: { page, pageSize: 20 },
    })
  }
  async get(id: string, eventId: string, signal: AbortSignal) {
    const event = (
      await this.http.get<{ event: PropertyHistoryEvent }>(`/properties/${id}/history/${eventId}`, {
        signal,
      })
    ).event
    if (event.id !== eventId) throw new Error('PROPERTY_HISTORY_EVENT_MISMATCH')
    return event
  }
}
export const propertyHistoryService = new PropertyHistoryService()
