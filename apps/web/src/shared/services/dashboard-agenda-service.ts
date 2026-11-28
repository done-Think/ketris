import type { components } from '@shared/types/generated/api'
import type { AgendaEventNotificationSource } from '@shared/types/dashboard-agenda-notifications'
import { BaseService } from '@shared/lib/api/base-service'

class DashboardAgendaService extends BaseService {
  async list(
    from: string,
    to: string,
    accessToken: string,
    signal: AbortSignal,
  ): Promise<AgendaEventNotificationSource[]> {
    const response = await this.http.get<components['schemas']['AgendaEventsResponse']>(
      '/agenda/events',
      {
        params: { from, to },
        signal,
        headers: { Authorization: `Bearer ${accessToken}` },
        sessionAccessToken: accessToken,
      },
    )
    return response.events.flatMap((event) => ('participantName' in event ? [event] : []))
  }
}

export const dashboardAgendaService = new DashboardAgendaService()
