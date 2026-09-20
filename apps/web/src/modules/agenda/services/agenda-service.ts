import { BaseService } from '@shared/lib/api/base-service'

import type {
  AgendaEventApi,
  CreateAgendaEventPayload,
  RescheduleAgendaEventPayload,
} from '../types/agenda-event'

interface AgendaEventResponse {
  event: AgendaEventApi
}

interface AgendaEventsResponse {
  events: AgendaEventApi[]
}

export class AgendaService extends BaseService {
  private readonly path = '/agenda/events'

  list(from: string, to: string): Promise<AgendaEventApi[]> {
    return this.http
      .get<AgendaEventsResponse>(this.path, { params: { from, to } })
      .then((data) => data.events)
  }

  create(payload: CreateAgendaEventPayload): Promise<AgendaEventApi> {
    return this.http.post<AgendaEventResponse>(this.path, payload).then((data) => data.event)
  }

  reschedule(id: string, payload: RescheduleAgendaEventPayload): Promise<AgendaEventApi> {
    return this.http
      .post<AgendaEventResponse>(`${this.path}/${id}/reschedule`, payload)
      .then((data) => data.event)
  }

  cancel(id: string): Promise<AgendaEventApi> {
    return this.http
      .post<AgendaEventResponse>(`${this.path}/${id}/cancel`)
      .then((data) => data.event)
  }
}

export const agendaService = new AgendaService()
