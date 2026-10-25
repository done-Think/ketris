'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { agendaService } from '@modules/agenda/services/agenda-service'
import { agendaQueryKeys } from '@modules/agenda/config/agenda-query-keys'
import type { AgendaEventNotificationSource } from '@shared/types/dashboard-agenda-notifications'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

export function useDashboardAgendaNotifications(): DashboardNotificationItem[] {
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const t = useTranslations('agenda.dashboard')
  const today = useMemo(() => dayjs().startOf('day'), [])
  const horizonEnd = useMemo(() => today.add(1, 'day'), [today])

  const eventsQuery = useQuery<AgendaEventNotificationSource[]>({
    queryKey: agendaQueryKeys.notifications(
      tenantId,
      session?.user?.id,
      session?.role,
      today.format('YYYY-MM-DD'),
    ),
    queryFn: async () => {
      const events = await agendaService.list(today.toISOString(), horizonEnd.toISOString())
      return events.flatMap((event) => ('participantName' in event ? [event] : []))
    },
    enabled: Boolean(tenantId && session?.user?.id && session?.role) && session?.role !== 'RENTER',
  })

  return useMemo<DashboardNotificationItem[]>(() => {
    if (session?.role === 'RENTER') return []
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
          property: event.propertyReference ?? event.propertyLabel ?? t('propertyNotInformed'),
          time: dayjs(event.start).format('HH:mm'),
        }),
      }))
  }, [eventsQuery.data, session?.role, t])
}
