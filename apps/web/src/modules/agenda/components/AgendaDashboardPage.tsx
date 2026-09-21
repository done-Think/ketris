'use client'

import { Box, Stack } from '@mui/material'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useSnackbar } from 'notistack'

import { useProperties } from '@modules/properties/hooks/use-properties'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

import { agendaTimeSlots } from '../data/agenda-events'
import {
  useAgendaEvents,
  useCreateAgendaEvent,
  useRescheduleAgendaEvent,
} from '../hooks/use-agenda-events'
import { agendaOtherPropertyValue } from '../schemas/agenda-event-form-schema'
import type {
  AgendaEvent,
  AgendaEventApiKind,
  AgendaEventFormValues,
  AgendaPropertyOption,
  AgendaRescheduleFormValues,
} from '../types/agenda-event'
import { errorMessage } from '../utils/error-message'
import { toAgendaEvent } from '../utils/map-agenda-event'
import { AgendaDashboardHeader } from './agenda-dashboard/AgendaDashboardHeader'
import { AgendaWeekCalendar } from './agenda-dashboard/AgendaWeekCalendar'
import {
  agendaVisibleDayCount,
  buildAgendaCalendarDays,
  getAgendaNotifications,
  getAgendaWeekRange,
} from './agenda-dashboard/agenda-dashboard-shared'
import { AgendaEventDetailDialog } from './AgendaEventDetailDialog'
import { AgendaEventFormDialog } from './AgendaEventFormDialog'

export function AgendaDashboardPage() {
  const t = useTranslations('agenda.dashboard')
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const today = useMemo(() => dayjs().locale('pt-br').startOf('day'), [])
  const currentMonthEnd = useMemo(() => today.endOf('month'), [today])
  const [weekStartDate, setWeekStartDate] = useState(() => today)
  const agendaDays = useMemo(() => buildAgendaCalendarDays(weekStartDate), [weekStartDate])

  const eventsQuery = useAgendaEvents(tenantId, today.toISOString(), currentMonthEnd.toISOString())
  const events = useMemo(
    () =>
      (eventsQuery.data ?? []).filter((event) => event.status !== 'CANCELLED').map(toAgendaEvent),
    [eventsQuery.data],
  )
  const createAgendaEventMutation = useCreateAgendaEvent(tenantId)
  const rescheduleAgendaEventMutation = useRescheduleAgendaEvent(tenantId)
  const propertiesQuery = useProperties()

  const propertyOptions = useMemo<AgendaPropertyOption[]>(
    () =>
      (propertiesQuery.data ?? []).map((property) => ({
        href: `/dashboard/properties/${property.id}`,
        id: property.id,
        label: property.address
          ? `${property.title} - ${property.address.neighborhood}, ${property.address.city}`
          : property.title,
      })),
    [propertiesQuery.data],
  )
  const weekRange = getAgendaWeekRange(agendaDays)
  const notifications = useMemo(
    () => getAgendaNotifications({ events, t, today }),
    [events, t, today],
  )
  const selectedEventDate = selectedEvent?.scheduledDate ?? ''
  const nextWeekStart = weekStartDate.add(agendaVisibleDayCount, 'day')
  const previousWeekStart = weekStartDate.subtract(agendaVisibleDayCount, 'day')
  const disablePreviousWeek = !previousWeekStart.isAfter(today.subtract(1, 'day'), 'day')
  const disableNextWeek = nextWeekStart.isAfter(currentMonthEnd, 'day')

  const closeEventDialog = () => setSelectedEvent(null)
  const showScheduledWeek = (date: dayjs.Dayjs) => {
    if (date.isBefore(today, 'day')) {
      setWeekStartDate(today)
      return
    }

    const daysFromToday = date.startOf('day').diff(today, 'day')
    const weekOffset = Math.floor(daysFromToday / agendaVisibleDayCount) * agendaVisibleDayCount

    setWeekStartDate(today.add(weekOffset, 'day'))
  }

  const openNotificationEvent = (notification: DashboardNotificationItem) => {
    const event = events.find((agendaEvent) => agendaEvent.id === notification.href?.query?.eventId)
    if (!event) return

    showScheduledWeek(dayjs(event.scheduledDate))
    setSelectedEvent(event)
  }

  const rescheduleSelectedEvent = async (values: AgendaRescheduleFormValues) => {
    if (!selectedEvent) return

    const nextDate = dayjs(values.scheduledDate)
    const nextStart = dayjs(`${values.scheduledDate}T${values.scheduledTime}`)

    try {
      await rescheduleAgendaEventMutation.mutateAsync({
        id: selectedEvent.id,
        payload: { start: nextStart.toISOString() },
      })
      showScheduledWeek(nextDate)
      enqueueSnackbar(
        t('rescheduleSuccess', {
          date: nextDate.format('DD/MM/YYYY'),
          time: values.scheduledTime,
          title: selectedEvent.title,
        }),
        { variant: 'success' },
      )
      closeEventDialog()
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('rescheduleError')), { variant: 'error' })
    }
  }

  const createAgendaEvent = async (values: AgendaEventFormValues) => {
    const scheduledDate = dayjs(values.scheduledDate)
    const start = dayjs(`${values.scheduledDate}T${values.scheduledTime}`)
    const useCustomProperty = values.propertyId === agendaOtherPropertyValue
    const customProperty = values.customProperty.trim()

    try {
      await createAgendaEventMutation.mutateAsync({
        title: values.title,
        kind: values.kind ? (values.kind as AgendaEventApiKind) : undefined,
        ...(useCustomProperty
          ? { propertyReference: customProperty }
          : { propertyId: values.propertyId }),
        start: start.toISOString(),
        durationMinutes: values.durationMinutes,
        participantName: values.participant,
        participantPhone: values.phone,
        notes: values.notes.trim() || t('defaultEventNotes'),
      })
      showScheduledWeek(scheduledDate)
      setIsEventFormOpen(false)
      enqueueSnackbar(t('createSuccess', { title: values.title }), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('createError')), { variant: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.4}>
        <AgendaDashboardHeader
          disableNextWeek={disableNextWeek}
          disablePreviousWeek={disablePreviousWeek}
          notifications={notifications}
          onNewEvent={() => setIsEventFormOpen(true)}
          onNextWeek={() => setWeekStartDate(nextWeekStart)}
          onNotificationSelect={openNotificationEvent}
          onPreviousWeek={() => setWeekStartDate(previousWeekStart)}
          weekRange={weekRange}
        />

        <AgendaWeekCalendar
          days={agendaDays}
          events={events}
          onSelectEvent={setSelectedEvent}
          timeSlots={agendaTimeSlots}
        />
      </Stack>

      <AgendaEventDetailDialog
        event={selectedEvent}
        eventDate={selectedEventDate}
        maxDate={currentMonthEnd.format('YYYY-MM-DD')}
        minDate={today.format('YYYY-MM-DD')}
        onClose={closeEventDialog}
        onReschedule={rescheduleSelectedEvent}
        open={Boolean(selectedEvent)}
      />

      <AgendaEventFormDialog
        maxDate={currentMonthEnd.format('YYYY-MM-DD')}
        minDate={today.format('YYYY-MM-DD')}
        onClose={() => setIsEventFormOpen(false)}
        onCreate={createAgendaEvent}
        open={isEventFormOpen}
        propertyOptions={propertyOptions}
      />
    </Box>
  )
}
