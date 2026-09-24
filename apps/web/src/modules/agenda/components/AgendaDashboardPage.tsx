'use client'

import { Box, Stack } from '@mui/material'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useSnackbar } from 'notistack'

import { dashboardProperties } from '@modules/properties/data/dashboard-properties'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

import { agendaEvents, agendaTimeSlots } from '../data/agenda-events'
import { agendaOtherPropertyValue } from '../schemas/agenda-event-form-schema'
import type {
  AgendaEvent,
  AgendaEventFormValues,
  AgendaPropertyOption,
  AgendaRescheduleFormValues,
} from '../types/agenda-event'
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
  const [events, setEvents] = useState<AgendaEvent[]>(agendaEvents)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const today = useMemo(() => dayjs().locale('pt-br').startOf('day'), [])
  const currentMonthEnd = useMemo(() => today.endOf('month'), [today])
  const [weekStartDate, setWeekStartDate] = useState(() => today)
  const agendaDays = useMemo(() => buildAgendaCalendarDays(weekStartDate), [weekStartDate])
  const propertyOptions = useMemo<AgendaPropertyOption[]>(
    () =>
      dashboardProperties.map((property) => ({
        href: `/dashboard/properties/${property.id}`,
        id: property.id,
        label: `${property.title} - ${property.location}`,
      })),
    [],
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

  const rescheduleSelectedEvent = (values: AgendaRescheduleFormValues) => {
    if (!selectedEvent) return

    const nextDate = dayjs(values.scheduledDate)

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === selectedEvent.id
          ? {
              ...event,
              scheduledDate: values.scheduledDate,
              time: values.scheduledTime,
              status: 'Confirmada',
            }
          : event,
      ),
    )
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
  }

  const createAgendaEvent = (values: AgendaEventFormValues) => {
    const scheduledDate = dayjs(values.scheduledDate)
    const selectedProperty = propertyOptions.find((property) => property.id === values.propertyId)
    const customProperty = values.customProperty.trim()
    const useCustomProperty = values.propertyId === agendaOtherPropertyValue
    const propertyLabel = useCustomProperty
      ? customProperty
      : (selectedProperty?.label ?? customProperty)
    const propertyHref = useCustomProperty
      ? '/dashboard/properties'
      : (selectedProperty?.href ?? '/dashboard/properties')
    const nextEvent: AgendaEvent = {
      kind: values.kind,
      id: `agenda-${Date.now()}`,
      scheduledDate: values.scheduledDate,
      time: values.scheduledTime,
      durationMinutes: values.durationMinutes,
      title: values.title,
      property: propertyLabel,
      propertyHref,
      participant: values.participant,
      phone: values.phone,
      notes: values.notes.trim() || t('defaultEventNotes'),
      status: 'Confirmada',
      tone: 'primary',
    }

    setEvents((currentEvents) => [...currentEvents, nextEvent])
    showScheduledWeek(scheduledDate)
    setIsEventFormOpen(false)
    enqueueSnackbar(t('createSuccess', { title: values.title }), { variant: 'success' })
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
