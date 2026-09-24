'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { httpClient } from '@shared/lib/api/http-client'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

// Formato mínimo da resposta de GET /api/agenda/events — só os campos que a notificação usa.
// Chamado direto via httpClient (não importa o módulo `agenda`) pra esse hook, usado em toda
// página do dashboard, não criar uma dependência cruzada entre módulos de domínio (Princípio I).
interface AgendaEventNotificationSource {
  id: string
  title: string
  status: 'CONFIRMED' | 'PENDING' | 'RESCHEDULE' | 'CANCELLED'
  start: string
  propertyReference: string | null
  participantName: string
}

function isVisitEvent(title: string) {
  return title.toLocaleLowerCase('pt-BR').includes('visita')
}

/**
 * Mesma lógica de "visita marcada para hoje" que `getAgendaNotifications` calcula na própria
 * página da agenda (ver modules/agenda/components/agenda-dashboard/agenda-dashboard-shared.ts) —
 * duplicada aqui, deliberadamente, em vez de importada do módulo `agenda`, pra não criar uma
 * dependência cruzada entre módulos de domínio. "Compromisso atribuído" fica de fora: o backend
 * ainda não retorna o nome de quem criou o evento, então essa notificação nunca teria dado pra
 * popular de verdade (mesma limitação da própria página da agenda hoje).
 */
export function useDashboardAgendaNotifications(): DashboardNotificationItem[] {
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const t = useTranslations('agenda.dashboard')
  const today = useMemo(() => dayjs().startOf('day'), [])
  const horizonEnd = useMemo(() => today.add(1, 'day'), [today])

  const eventsQuery = useQuery({
    queryKey: ['dashboard-agenda-notifications', tenantId, today.format('YYYY-MM-DD')],
    queryFn: () =>
      httpClient
        .get<{ events: AgendaEventNotificationSource[] }>('/agenda/events', {
          params: { from: today.toISOString(), to: horizonEnd.toISOString() },
        })
        .then((data) => data.events),
    enabled: Boolean(tenantId),
  })

  return useMemo<DashboardNotificationItem[]>(() => {
    const events = eventsQuery.data ?? []

    return events
      .filter((event) => event.status !== 'CANCELLED' && isVisitEvent(event.title))
      .map((event) => ({
        href: { pathname: '/dashboard/agenda' as const, query: { eventId: event.id } },
        id: `${event.id}-today-visit`,
        kind: 'todayVisit' as const,
        title: t('todayVisitTitle'),
        message: t('todayVisitMessage', {
          participant: event.participantName,
          property: event.propertyReference ?? t('propertyNotInformed'),
          time: dayjs(event.start).format('HH:mm'),
        }),
      }))
  }, [eventsQuery.data, t])
}
