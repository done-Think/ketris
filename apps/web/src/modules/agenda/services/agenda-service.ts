import type { AgendaPropertyOptionsResponseDTO } from '@server/agenda/types/http'
import type { ListUsersResponseDTO } from '@server/auth/types/http'
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
  CancelAgendaEventPayload,
  RescheduleAgendaEventPayload,
  UpdateAgendaEventPayload,
} from '../types/agenda-event'

export class AgendaService extends BaseService {
  private readonly path = '/agenda/events'
  listProperties(search: string, page = 1): Promise<AgendaPropertyOptionsResponseDTO> {
    return this.http.get('/agenda/properties', { params: { search, page, pageSize: 25 } })
  }
  async listAgents(): Promise<AgendaAgentOption[]> {
    const agents: AgendaAgentOption[] = []
    for (let page = 1; ; page += 1) {
      const result = await this.http.get<ListUsersResponseDTO>('/auth/users', {
        params: { page, pageSize: 100 },
      })
      agents.push(
        ...result.users
          .filter((user) => user.role === 'AGENT' && user.active && !user.pendingApproval)
          .map(({ id, name }) => ({ id, name })),
      )
      if (!result.users.length || page * result.pageSize >= result.total) return agents
    }
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

  cancel(id: string, payload: CancelAgendaEventPayload): Promise<AgendaEventApi> {
    return this.http
      .post<AgendaEventResponse>(`${this.path}/${id}/cancel`, payload)
      .then((data) => data.event)
  }
}

export const agendaService = new AgendaService()
