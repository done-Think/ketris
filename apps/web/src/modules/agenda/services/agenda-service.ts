import { BaseService } from '@shared/lib/api/base-service'
import type {
  AgendaChargeApi,
  AgendaMaintenanceApi,
  AgendaPage,
} from '../types/agenda-organization'

import type {
  AgendaEventApi,
  AgendaAgentOption,
  AgendaEventReadApi,
  AgendaEventResponse,
  AgendaEventsResponse,
  CreateAgendaEventPayload,
  RescheduleAgendaEventPayload,
  UpdateAgendaEventPayload,
} from '../types/agenda-event'

export class AgendaService extends BaseService {
  private readonly path = '/agenda/events'
  async listAgents(): Promise<AgendaAgentOption[]> {
    const { users } = await this.http.get<{
      users: (AgendaAgentOption & { role: string; active: boolean; pendingApproval: boolean })[]
    }>('/auth/users')
    return users
      .filter((user) => user.role === 'AGENT' && user.active && !user.pendingApproval)
      .map(({ id, name }) => ({ id, name }))
  }

  private async listPages<T>(path: string): Promise<T[]> {
    const items: T[] = []
    let page = 1
    while (true) {
      const result = await this.http.get<AgendaPage<T>>(path, { params: { page, pageSize: 100 } })
      items.push(...result.items)
      if (result.items.length === 0 || items.length >= result.totalCount) return items
      page += 1
    }
  }

  listCharges(): Promise<AgendaChargeApi[]> {
    return this.listPages<AgendaChargeApi>('/financial/charges')
  }

  listMaintenance(): Promise<AgendaMaintenanceApi[]> {
    return this.listPages<AgendaMaintenanceApi>('/maintenance/tickets')
  }

  list(from: string, to: string): Promise<AgendaEventReadApi[]> {
    return this.http
      .get<AgendaEventsResponse>(this.path, { params: { from, to } })
      .then((data) => data.events)
  }

  create(payload: CreateAgendaEventPayload): Promise<AgendaEventApi> {
    return this.http.post<AgendaEventResponse>(this.path, payload).then((data) => data.event)
  }

  update(id: string, payload: UpdateAgendaEventPayload): Promise<AgendaEventApi> {
    return this.http
      .patch<AgendaEventResponse>(`${this.path}/${id}`, payload)
      .then((data) => data.event)
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
