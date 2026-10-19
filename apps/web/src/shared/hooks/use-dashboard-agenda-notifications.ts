'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { httpClient } from '@shared/lib/api/http-client'
import type { AgendaEventNotificationSource } from '@shared/types/dashboard-agenda-notifications'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

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
    enabled: Boolean(tenantId) && session?.papel !== 'RENTER',
  })

  return useMemo<DashboardNotificationItem[]>(() => {
    if (session?.papel === 'RENTER') return []
    const events = eventsQuery.data ?? []

    return events
      .filter((event) => event.status !== 'CANCELLED' && event.kind === 'VISIT')
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
  }, [eventsQuery.data, session?.papel, t])
}
